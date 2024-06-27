import { BinaryBitmap, HybridBinarizer, InvertedLuminanceSource, NotFoundException, QRCodeReader, RGBLuminanceSource, Result, ResultMetadataType } from '../../zxing-js/src';
import Version from '../../zxing-js/src/core/qrcode/decoder/Version';
import { DetectedDefect } from './defects';
import { InspectionConfig } from './types';

async function waitForImageLoad(image: HTMLImageElement): Promise<void> {
    return new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
    });
}

async function getDataFromFile(file: File): Promise<{
    width: number;
    height: number;
    luminances: Uint8ClampedArray;
}> {
    const image = new Image();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    image.src = URL.createObjectURL(file);
    await waitForImageLoad(image);
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const { width, height } = canvas;
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;
    const luminances = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        luminances[i / 4] = (r + g + b) / 3;
    }

    return { width, height, luminances };
}

export async function inspect(file: File, config: InspectionConfig): Promise<InspectionResult> {
    const defects: DetectedDefect[] = [];
    try {
        await run(file, config, defects);
    } catch (e) {
        addUnknownError(defects, e + '');
    }
    return { defects };
}

function decodeOriginalAndInverted(original: BinaryBitmap, inverted: BinaryBitmap): {
    result?: Result,
    error?: unknown,
    maxFinderPatternCount: number,
    resultType: 'original' | 'inverted';
} {
    let resultOriginal: Result | undefined;
    let resultInverted: Result | undefined;
    let errorOriginal: unknown | undefined;
    let errorInverted: unknown | undefined;
    const reader = new QRCodeReader();

    try {
        resultOriginal = reader.decode(original);
    } catch (e) {
        errorOriginal = e;
    }
    const originalFinderPatternCount = (window as any).finderPatternCount;

    try {
        const reader = new QRCodeReader();
        resultInverted = reader.decode(inverted);
    } catch (e) {
        errorInverted = e;
    }
    const invertedFinderPatternCount = (window as any).finderPatternCount;
    const maxFinderPatternCount = Math.max(originalFinderPatternCount, invertedFinderPatternCount);

    if (errorOriginal && errorInverted) {
        return {
            error: errorOriginal,
            resultType: 'original',
            maxFinderPatternCount,
        };
    }
    if (resultOriginal && !errorOriginal) {
        return {
            result: resultOriginal,
            resultType: 'original',
            maxFinderPatternCount,
        };
    }
    if (resultInverted && !errorInverted) {
        return {
            result: resultInverted,
            resultType: 'inverted',
            maxFinderPatternCount,
        };
    }

    return {
        error: errorOriginal,
        resultType: 'original',
        maxFinderPatternCount,
    };
}

async function inspect6(file: File, defects: DetectedDefect[]) {
    const { width, height, luminances } = await getDataFromFile(file);
    const sizes: number[] = [];
    const positions: number[][] = [];

    for (; ;) {
        try {
            const luminanceSource = new RGBLuminanceSource(luminances, width, height);
            const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
            const reader = new QRCodeReader();
            const result = reader.decode(binaryBitmap);
            const points = result.getResultPoints();
            const x0 = points[0].getX();
            const y0 = points[0].getY();
            const x1 = points[1].getX();
            const y1 = points[1].getY();
            const x2 = points[2].getX();
            const y2 = points[2].getY();
            const x3 = points[3].getX();
            const y3 = points[3].getY();
            positions.push([x0, y0, x1, y1, x2, y2, x3, y3]);
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    const index = i * width + j;
                    if ((x1 - x0) * (i - y0) - (y1 - y0) * (j - x0) > 0 &&
                        (x2 - x1) * (i - y1) - (y2 - y1) * (j - x1) > 0 &&
                        (x0 - x2) * (i - y2) - (y0 - y2) * (j - x2) > 0) {
                        luminances[index] = 255;
                    }
                }
            }
            const distance01 = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
            sizes.push(distance01);
        } catch {
            break;
        }
    }

    if (sizes.length === 0) {
        return;
    }

    const averageSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    for (let i = 0; i < sizes.length; i++) {
        for (let j = i + 1; j < sizes.length; j++) {
            let minDistance = Number.MAX_VALUE;
            for (let p = 0; p < 4; p++) {
                for (let q = 0; q < 4; q++) {
                    const distance = Math.sqrt((positions[i][p * 2] - positions[j][q * 2]) ** 2 + (positions[i][p * 2 + 1] - positions[j][q * 2 + 1]) ** 2);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
            }
            if (minDistance < averageSize) {
                defects.push({
                    code: 'QR006',
                    message: `최단 거리가 ${minDistance.toFixed(2)}인 QR 코드 쌍이 발견되었으며, 변 길이의 평균은 ${averageSize}입니다.`,
                });
            }
        }
    }
}

async function run(file: File, config: InspectionConfig, defects: DetectedDefect[]) {
    inspect9(file, config, defects);
    await inspect6(file, defects);

    const { width, height, luminances } = await getDataFromFile(file);
    const luminanceSource = new RGBLuminanceSource(luminances, width, height);
    const originalBinaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const invertedBinaryBitmap = new BinaryBitmap(new HybridBinarizer(new InvertedLuminanceSource(luminanceSource)));
    try {
        const { result, error, resultType, maxFinderPatternCount } = decodeOriginalAndInverted(originalBinaryBitmap, invertedBinaryBitmap);
        if (resultType === 'inverted') {
            defects.push({
                code: 'QR003',
                message: '배경이 어둡고 전경이 밝은 QR 코드는 인식 소프트웨어에 따라서 인식에 실패할 수 있습니다.',
            });
        }
        if (maxFinderPatternCount >= 9) {
            defects.push({
                code: 'QR008',
                message: `위치 탐지 패턴이 너무 많습니다. 위치 탐지 패턴이 ${maxFinderPatternCount}개 검출되었습니다.`,
            });
        }
        if (error) {
            throw error;
        }
        if (!result) {
            throw '결과가 없습니다.';
        }
        const metadata = result.getResultMetadata();
        if (!metadata) {
            addUnknownError(defects);
            return;
        }
        const errorCorrectionLevel = metadata.get(ResultMetadataType.ERROR_CORRECTION_LEVEL);
        if (config.mediaType === 'screen') {
            if (errorCorrectionLevel === 'Q' || errorCorrectionLevel === 'H') {
                defects.push({
                    code: 'QR010',
                    message: `과도한 오류 정정 수준인 ${errorCorrectionLevel}가 사용되었습니다. L 또는 M을 사용하십시오.`,
                });
            }
        }

        const version = metadata.get(ResultMetadataType.QR_CODE_VERSION);
        if (!(version instanceof Version)) {
            addUnknownError(defects, 'Version이 없습니다.');
            return;
        }
        const modules = version.getDimensionForVersion();
        const moduleSize = config.sideLength * 10 / modules;
        if (moduleSize < 0.4) {
            defects.push({
                code: 'QR005',
                message: `너무 작은 모듈 크기입니다. 모듈 크기가 약 ${moduleSize.toFixed(2)} mm입니다. 0.4 mm 이상으로 확대하십시오.`,
            });
        }

        const text = result.getText();
        if (config.validateUrl) {
            try {
                const fetchResult = await fetch(text, { redirect: 'follow' });
                if (!fetchResult.ok) {
                    throw `HTTP 상태 코드가 ${fetchResult.status}입니다.`;
                }
            } catch (e) {
                defects.push({
                    code: 'QR011',
                    message: e + '',
                });
            }
        }
        const textLower = text.toLowerCase();
        if (textLower.startsWith('http://') || textLower.startsWith('https://')) {
            const url = new URL(text);
            if (config.hostAllowList.length > 0) {
                if (!config.hostAllowList.includes(url.host)) {
                    defects.push({
                        code: 'QR007',
                        message: `허용 호스트가 아닙니다. 호스트가 ${url.host}입니다.`,
                    });
                }
            }
            if (config.hostBlockList.length > 0) {
                if (config.hostBlockList.includes(url.host)) {
                    defects.push({
                        code: 'QR007',
                        message: `금지 호스트입니다. 호스트가 ${url.host}입니다.`,
                    });
                }
            }
        }

        const noError = metadata.get(ResultMetadataType.QR_CODE_NO_ERROR);
        if (noError === false) {
            defects.push({
                code: 'QR012',
                message: '오류 정정이 발생했습니다. 의도적인 손상이 있는 QR 코드인 경우에는 이 결함을 무시하십시오.',
            });
        }

        const isMirrored = metadata.get(ResultMetadataType.QR_CODE_IS_MIRRORED);
        if (isMirrored) {
            defects.push({
                code: 'QR004',
                message: '거울상으로 뒤집힌 QR 코드는 인식 소프트웨어에 따라서 인식에 실패할 수 있습니다.',
            });
        }

        const darkQuietZoneCount = metadata.get(ResultMetadataType.QR_CODE_DARK_QUIET_ZONE_COUNT);
        if (typeof darkQuietZoneCount !== 'number') {
            throw 'Dark Quiet Zone Count가 없습니다.';
        }
        if (darkQuietZoneCount > 16) {
            defects.push({
                code: 'QR002',
                message: `여백 영역에서 어두운 것으로 처리된 모듈이 ${darkQuietZoneCount}개 있습니다.`,
            });
        }

        const lightLuminanceAverage = metadata.get(ResultMetadataType.QR_CODE_AVERAGE_LIGHT_LUMINANCE);
        if (typeof lightLuminanceAverage !== 'number') {
            throw 'Light Luminance Average가 없습니다.';
        }
        const darkLuminanceAverage = metadata.get(ResultMetadataType.QR_CODE_AVERAGE_DARK_LUMINANCE);
        if (typeof darkLuminanceAverage !== 'number') {
            throw 'Dark Luminance Average가 없습니다.';
        }
        const contrast = (lightLuminanceAverage - darkLuminanceAverage) * 100 / 255;
        if (contrast < config.contrastThreshold) {
            defects.push({
                code: 'QR001',
                message: `대비가 ${contrast.toFixed(2)}%입니다. ${contrast.toFixed(2)}% 이상으로 설정하십시오.`,
            });
        }

        const transformErrorCount = metadata.get(ResultMetadataType.QR_CODE_TRANSFORM_ERROR_COUNT);
        if (typeof transformErrorCount !== 'number') {
            throw 'Transform Error Count가 없습니다.';
        }

        const transformErrorRate = transformErrorCount / 4 / (modules * modules);
        if (transformErrorRate > 0.25) {
            defects.push({
                code: 'QR013',
                message: `어긋한 픽셀이 너무 많습니다. 픽셀당 오류 비율이 약 ${(transformErrorRate * 100).toFixed(1)}%입니다.`,
            });
        }
    } catch (e) {
        if (e instanceof NotFoundException) {
            addUnknownError(defects, 'QR 코드를 찾을 수 없습니다.');
            return;
        }
        throw e;
    }
}

export interface InspectionResult {
    defects: DetectedDefect[];
}

function inspect9(file: File, config: InspectionConfig, defects: DetectedDefect[]) {
    if (config.bottomHeight <= 0) {
        defects.push({
            code: 'QR009',
            message: `하단 높이는 0보다 커야 합니다. 하단 높이가 ${config.bottomHeight}입니다.`,
        });
    }
    if (config.bottomHeight + config.sideLength > config.userReach) {
        defects.push({
            code: 'QR009',
            message: `상단 높이는 사용자 도달 가능 높이보다 작아야 합니다. 상단 높이는 ${config.bottomHeight + config.sideLength}이고, 사용자 도달 가능 높이는 ${config.userReach}입니다.`,
        });
    }
}

function addUnknownError(defects: DetectedDefect[], detail?: string) {
    defects.push({
        code: 'QR999',
        message: '알 수 없는 오류입니다.' + (detail ? ' 자세한 내용: ' + detail : ''),
    });
}
