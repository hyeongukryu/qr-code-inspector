/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*namespace com.google.zxing.oned {*/

import BarcodeFormat from '../BarcodeFormat';
import BitArray from '../common/BitArray';
import DecodeHintType from '../DecodeHintType';
import NotFoundException from '../NotFoundException';
import Result from '../Result';
import OneDReader from './OneDReader';

/**
 * @author Daniel Switkin <dswitkin@google.com>
 * @author Sean Owen
 */
export default class MultiFormatOneDReader extends OneDReader {

  private readers: OneDReader[] = [];

  public constructor(hints?: Map<DecodeHintType, any>) {
    super();
    const possibleFormats = !hints ? null : <BarcodeFormat[]>hints.get(DecodeHintType.POSSIBLE_FORMATS);
    const useCode39CheckDigit = hints && hints.get(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT) !== undefined;
    const useCode39ExtendedMode = hints && hints.get(DecodeHintType.ENABLE_CODE_39_EXTENDED_MODE) !== undefined;

    if (possibleFormats) {
    }
    if (this.readers.length === 0) {
    }
  }

  // @Override
  public decodeRow(
    rowNumber: number,
    row: BitArray,
    hints: Map<DecodeHintType, any>
  ): Result {

    for (let i = 0; i < this.readers.length; i++) {
      try {
        return this.readers[i].decodeRow(rowNumber, row, hints);
      } catch (re) {
        // continue
      }
    }

    throw new NotFoundException();
  }

  // @Override
  public reset(): void {
    this.readers.forEach(reader => reader.reset());
  }
}
