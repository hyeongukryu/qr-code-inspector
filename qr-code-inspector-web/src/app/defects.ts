export interface DefectType {
    code: string;
    name: string;
    resolution: string;
}

export interface DetectedDefect {
    code: string;
    message: string;
}

const DefectTypes: DefectType[] = [
    {
        'code': 'QR001',
        'name': '배경과 전경 대비 부족',
        'resolution': '배경과 전경이 더 강하게 대비되도록 하십시오.'
    },
    {
        'code': 'QR002',
        'name': '여백 부족',
        'resolution': '주변에 4칸 이상의 여백을 추가하십시오.'
    },
    {
        'code': 'QR003',
        'name': '색상 반전됨',
        'resolution': '배경을 밝게, 전경을 어둡게 변경하십시오.'
    },
    {
        'code': 'QR004',
        'name': '거울 뒤집힘',
        'resolution': 'QR 코드를 좌우 또는 상하로 반전하십시오.'
    },
    {
        'code': 'QR005',
        'name': '너무 작음',
        'resolution': '더 크게 표시/인쇄되도록 조정하십시오.'
    },
    {
        'code': 'QR006',
        'name': '너무 가까운 인접 QR 코드',
        'resolution': 'QR 코드 사이의 간격을 더 넓게 조정하십시오.'
    },
    {
        'code': 'QR007',
        'name': '외부 서비스 의존 URL',
        'resolution': '의도한 경우가 아니라면 목적 URL을 직접 QR 코드에 넣어 생성하십시오.'
    },
    {
        'code': 'QR008',
        'name': '혼동할 수 있는 배경',
        'resolution': 'QR 코드로 잘못 인식할 수 있는 배경을 제거하십시오.'
    },
    {
        'code': 'QR009',
        'name': '높이 범위 초과',
        'resolution': '너무 낮거나 너무 높은 곳을 피하여 QR 코드를 배치하십시오.'
    },
    {
        'code': 'QR010',
        'name': '과도한 오류 정정 수준',
        'resolution': '디지털 이미지에서는 낮은 오류 정정 수준을 사용하십시오.'
    },
    {
        'code': 'QR011',
        'name': 'HTTP 상태 코드 오류',
        'resolution': 'URL로 접근하였을 때 올바른 HTTP 상태 코드를 응답하도록 URL 또는 서버 설정을 변경하십시오.'
    },
    {
        'code': 'QR012',
        'name': '오류 정정 발생',
        'resolution': '시각적 효과, 오염 등의 오류 발생 원인을 제거하십시오.'
    },
    {
        'code': 'QR013',
        'name': '표면 구겨짐',
        'resolution': '표면을 평평하게 고르십시오.'
    },
    {
        'code': 'QR999',
        'name': 'QR 코드 인식 실패',
        'resolution': 'QR 코드를 다시 생성하거나 검사 대상 이미지가 사진인 경우 다시 촬영하십시오.'
    },
];

export function getDefectType(code: string): DefectType | undefined {
    return DefectTypes.find(defect => defect.code === code);
}
