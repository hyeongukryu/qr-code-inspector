export type MediaType = 'paper' | 'screen';

export interface InspectionConfig {
    contrastThreshold: number;
    sideLength: number;
    bottomHeight: number;
    userReach: number;
    mediaType: MediaType;
    hostAllowList: string[];
    hostBlockList: string[];
    validateUrl: boolean;
}

export const DefaultInspectionConfig: InspectionConfig = {
    contrastThreshold: 50,
    sideLength: 10,
    bottomHeight: 100,
    userReach: 180,
    mediaType: 'paper',
    hostAllowList: [],
    hostBlockList: [
        'bit.ly',
        'tinyurl.com',
        'goo.gl',
        't.co',
        'm.site.naver.com',
        'url.kr',
        'lrl.kr',
    ],
    validateUrl: false,
};
