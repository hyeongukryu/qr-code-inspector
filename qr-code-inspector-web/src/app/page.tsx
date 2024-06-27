import Inspector from './Inspector';
import githubMark from './github-mark.svg';
import Image from 'next/image';

export default function Home() {
  return <main className="container mx-auto">
    <div className="text-center">
      <div className="mt-3">
        2024 한국컴퓨터종합학술대회(KCC 2024)
      </div>
      <h1 className="mt-5 text-2xl">
        <span className="mx-[0.125em] inline-block break-keep">
          QR 코드 인식 향상을 위한
        </span>
        <span className="mx-[0.125em] inline-block break-keep">
          결함 검사 도구 개발
        </span>
      </h1>
      <div className="mt-3 flex justify-center text-lg">
        <a className='text-blue-700 hover:underline'
          href='https://www.hyeonguk.com/' rel='noreferrer noopener' target='_blank'>
          <span className="mx-5">류형욱</span>
        </a>
        <a className='text-blue-700 hover:underline'
          href='https://gclab.kaist.ac.kr/' rel='noreferrer noopener' target='_blank'>
          <span className="mx-5">최성희</span>
        </a>
      </div>
      <div>
        <span className="mx-5">KAIST 전산학부</span>
      </div>
      <div>
        <a className='m-1 inline-block rounded p-1 hover:bg-gray-200'
          href="https://github.com/hyeongukryu/qr-code-inspector" rel='noreferrer noopener' target='_blank'>
          <Image src={githubMark} alt="GitHub" width={36} height={36} />
        </a>
      </div>
    </div>
    <hr className='my-2' />
    <Inspector />
  </main>;
}
