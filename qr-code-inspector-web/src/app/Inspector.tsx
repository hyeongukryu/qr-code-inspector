'use client';

import { useRef, useState } from 'react';
import { DetectedDefect, getDefectType } from './defects';
import { DefaultInspectionConfig, InspectionConfig, MediaType } from './types';
import { validateNumber } from './util';
import { inspect } from './core';

export default function Inspector() {
  const [detectedDefects, setDetectedDefects] = useState<DetectedDefect[]>();
  const submit = async (file: File, config: InspectionConfig) => {
    const { defects } = await inspect(file, config);
    setDetectedDefects(defects);
  };

  return <div>
    <Query submit={submit} />
    <hr />
    <Result defects={detectedDefects} />
    <div className="pb-8" />
  </div>;
}

function Query(props: { submit: (file: File, config: InspectionConfig) => void }) {
  const { submit } = props;

  const fileInput = useRef<HTMLInputElement>(null);

  const [contrastThreshold, setContrastThreshold] = useState(DefaultInspectionConfig.contrastThreshold.toString());
  const [hostAllowList, setHostAllowList] = useState(DefaultInspectionConfig.hostAllowList.join(';'));
  const [hostBlockList, setHostBlockList] = useState(DefaultInspectionConfig.hostBlockList.join(';'));
  const [validateUrl, setValidateUrl] = useState(DefaultInspectionConfig.validateUrl);
  const [sideLength, setSideLength] = useState(DefaultInspectionConfig.sideLength.toString());
  const [bottomHeight, setBottomHeight] = useState(DefaultInspectionConfig.bottomHeight.toString());
  const [userReach, setUserReach] = useState(DefaultInspectionConfig.userReach.toString());
  const [mediaType, setMediaType] = useState<MediaType>(DefaultInspectionConfig.mediaType);

  const isContrastThresholdValid = validateNumber(contrastThreshold, 0, 100);
  const isSideLengthValid = validateNumber(sideLength, 0, 100);
  const isBottomHeightValid = validateNumber(bottomHeight, 0, 300);
  const isUserReachValid = validateNumber(userReach, 0, 300);

  const isValid =
    isContrastThresholdValid &&
    isSideLengthValid &&
    isBottomHeightValid &&
    isUserReachValid;

  return <form className="my-6 *:my-3" onSubmit={(e) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    if (fileInput.current === null ||
      fileInput.current.files === null ||
      fileInput.current.files.length !== 1) {
      alert('파일을 선택하십시오.');
      return;
    }
    const file = fileInput.current.files[0];
    const config: InspectionConfig = {
      contrastThreshold: Number(contrastThreshold),
      hostAllowList: hostAllowList.split(';').map((host) => host.trim().toLowerCase()).filter((host) => host !== ''),
      hostBlockList: hostBlockList.split(';').map((host) => host.trim().toLowerCase()).filter((host) => host !== ''),
      validateUrl,
      sideLength: Number(sideLength),
      bottomHeight: Number(bottomHeight),
      userReach: Number(userReach),
      mediaType,
    };
    submit(file, config);
  }}>
    <h2 className="text-2xl font-bold">
      검사 구성
    </h2>
    <h3 className="text-lg font-bold">
      입력 이미지
    </h3>
    <div>
      <input className="mr-3 rounded border border-gray-400 p-1" ref={fileInput}
        type="file" accept="image/*" capture="environment" />
    </div>
    <div className="flex flex-row gap-6">
      <div className="w-1/2 *:my-3">
        <h3 className="text-lg font-bold">
          소프트웨어 설정
        </h3>
        <div>
          <div className='font-semibold'>최소 대비</div>
          <input
            aria-invalid={!isContrastThresholdValid}
            className='w-[5em] rounded border border-gray-400 p-1 text-right aria-[invalid="true"]:border-red-500 aria-[invalid="true"]:bg-red-100'
            value={contrastThreshold} onChange={(e) => setContrastThreshold(e.target.value)} /> %
          <div className="mt-1 break-keep text-xs text-gray-700">
            대비 비율이 이 값보다 낮으면 결함으로 간주합니다. 0에서 100 사이의 값을 입력합니다.
          </div>
        </div>
        <div>
          <div className='font-semibold'>허용 호스트 목록</div>
          <input className="w-full rounded border border-gray-400 p-1"
            value={hostAllowList} onChange={(e) => setHostAllowList(e.target.value)} />
          <div className="mt-1 break-keep text-xs text-gray-700">
            세미콜론으로 구분하여 여러 호스트를 입력할 수 있습니다. 검사를 생략하려면 비우십시오.
          </div>
        </div>
        <div>
          <div className='font-semibold'>금지 호스트 목록</div>
          <input className="w-full rounded border border-gray-400 p-1"
            value={hostBlockList} onChange={(e) => setHostBlockList(e.target.value)} />
          <div className="mt-1 break-keep text-xs text-gray-700">
            세미콜론으로 구분하여 여러 호스트를 입력할 수 있습니다. 검사를 생략하려면 비우십시오.
          </div>
        </div>
        <div>
          <div className='font-semibold'>깊은 URL 검사</div>
          <div className='my-1'>
            <input type="checkbox" id="validate-url" checked={validateUrl}
              onChange={(e) => setValidateUrl(e.target.checked)} />
            <label className="ml-1" htmlFor="validate-url">
              HTTP 상태 코드가 200인지 검사
            </label>
          </div>
          <div className="mt-1 break-keep text-xs text-gray-700">
            Fetch API를 이용하여 현재 웹 브라우저에서 검사합니다. 보안과 CORS 정책을 고려하여 선택하십시오.
          </div>
        </div>
      </div>
      <div className="w-1/2 *:my-3">
        <h3 className="text-lg font-bold">
          물리적 특성
        </h3>
        <div>
          <div className='font-semibold'>한 변의 길이</div>
          <input aria-invalid={!isSideLengthValid}
            className='w-[5em] rounded border border-gray-400 p-1 text-right  aria-[invalid="true"]:border-red-500 aria-[invalid="true"]:bg-red-100'
            value={sideLength} onChange={(e) => setSideLength(e.target.value)} /> cm
          <div className="mt-1 break-keep text-xs text-gray-700">
            QR 코드의 한 변의 길이(여백 제외)를 입력합니다. 0에서 100 사이의 값을 입력합니다.
          </div>
        </div>
        <div>
          <div className='font-semibold'>하단 높이</div>
          <input aria-invalid={!isBottomHeightValid}
            className='w-[5em] rounded border border-gray-400 p-1 text-right  aria-[invalid="true"]:border-red-500 aria-[invalid="true"]:bg-red-100'
            value={bottomHeight} onChange={(e) => setBottomHeight(e.target.value)} /> cm
          <div className="mt-1 break-keep text-xs text-gray-700">
            바닥에서부터 측정한 QR 코드의 하단의 높이(여백 제외)를 입력합니다. 0에서 300 사이의 값을 입력합니다.
          </div>
        </div>
        <div>
          <div className='font-semibold'>사용자 도달 가능 높이</div>
          <input aria-invalid={!isUserReachValid}
            className='w-[5em] rounded border border-gray-400 p-1 text-right  aria-[invalid="true"]:border-red-500 aria-[invalid="true"]:bg-red-100'
            value={userReach} onChange={(e) => setUserReach(e.target.value)} /> cm
          <div className="mt-1 break-keep text-xs text-gray-700">
            사용자가 QR 코드를 읽을 수 있는 최대 높이를 입력합니다.
            사용자의 리치와 관계가 있습니다. 0에서 300 사이의 값을 입력합니다.
          </div>
        </div>
        <div>
          <div className='font-semibold'>매체</div>
          <div className="my-1">
            <span>
              <input type="radio" id="media-paper" name="media"
                checked={mediaType === 'paper'} onChange={() => setMediaType('paper')} />
              <label className="ml-1" htmlFor="media-paper">
                종이
              </label>
            </span>
            <span className="ml-6">
              <input type="radio" id="media-screen" name="media"
                checked={mediaType === 'screen'} onChange={() => setMediaType('screen')} />
              <label className="ml-1" htmlFor="media-screen">
                화면
              </label>
            </span>
          </div>
          <div className="mt-1 break-keep text-xs text-gray-700">
            종이를 선택하면 &quot;과도한 오류 정정 수준&quot; 검사를 생략합니다.
          </div>
        </div>
      </div>
    </div>
    <button type="submit" disabled={!isValid}
      className="rounded bg-blue-500 px-6 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400">
      검사하기
    </button>
    {!isValid && <span className="ml-3 text-sm text-red-600">
      입력 이미지가 없거나 구성에 오류가 있습니다.
    </span>}
  </form >;
}

function Result(props: { defects: DetectedDefect[] | undefined }) {
  if (props.defects === undefined) {
    return <div className="my-6">
      <h2 className="text-2xl font-bold">
        검사 결과
      </h2>
      <p className="my-3 text-gray-600">
        검사가 완료되면 결과가 여기에 표시됩니다.
      </p>
    </div>;
  }
  return <div className="my-6">
    <h2 className="text-2xl font-bold">
      검사 결과
    </h2>
    <DetectedDefectsViewer defects={props.defects} />
  </div>;
}

function DetectedDefectsViewer(props: { defects: DetectedDefect[] }) {
  const [showMessage, setShowMessage] = useState(false);
  if (props.defects.length === 0) {
    return <div>
      <p className="my-3 font-bold text-green-600">
        발견된 결함이 없습니다.
      </p>
    </div>;
  }
  return <div className="*:my-3">
    <p className="font-bold text-red-600">
      결함이 {props.defects.length}개 발견되었습니다.
    </p>

    <div className="text-right">
      <input type="checkbox" id="show-message" checked={showMessage}
        onChange={(e) => setShowMessage(e.target.checked)} />
      <label className="ml-1" htmlFor="show-message">
        상세 정보 표시
      </label>
    </div>

    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="*:border *:border-gray-400 *:bg-gray-200 *:p-1">
          <th className="w-1/12">
            결함 코드
          </th>
          <th className="w-3/12">
            결함 설명
          </th>
          <th className="w-4/12">
            해결 방법
          </th>
          {showMessage && <th className="w-4/12">
            상세 정보
          </th>}
        </tr>
      </thead>
      <tbody>
        {props.defects.map((defect, index) => (
          <DetectedDefectRow key={index} defect={defect} showMessage={showMessage} />
        ))}
      </tbody>
    </table>
  </div>;
}

function DetectedDefectRow(props: { defect: DetectedDefect, showMessage: boolean }) {
  const { defect, showMessage } = props;
  const defectType = getDefectType(defect.code);
  if (defectType === undefined) {
    return <tr className="*:border *:border-gray-400 *:p-1">
      <td className="tabular-nums">
        {defect.code}
      </td>
      <td>
        알 수 없는 결함
      </td>
      <td>
      </td>
      {showMessage && <td>
        {defect.message}
      </td>}
    </tr>;
  }

  return <tr className="*:border *:border-gray-400 *:p-1">
    <td className="tabular-nums">
      {defect.code}
    </td>
    <td>
      {defectType.name}
    </td>
    <td>
      {defectType.resolution}
    </td>
    {showMessage && <td>
      {defect.message}
    </td>}
  </tr>;
}
