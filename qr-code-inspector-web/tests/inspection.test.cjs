const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { test } = require('node:test');
const fixture = require('./fixtures/qr-v3-m.json');

function makeImage(scenario) {
  const modules = fixture.modules.length;
  const scale = 8;
  const padding = 4;
  const size = (modules + padding * 2) * scale;
  const count = scenario.includes('pair') ? 2 : 1;
  const gap = scenario === 'far-pair' ? size : 0;
  const width = size * count + gap;
  const data = new Uint8ClampedArray(width * size * 4).fill(255);

  for (let code = 0; code < count; code++) {
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        let row = y;
        let col = x;
        if (['horizontal', 'inverted', 'near-pair', 'far-pair'].includes(scenario)) {
          col = modules - 1 - x;
        } else if (scenario === 'vertical') {
          row = modules - 1 - y;
        } else if (scenario === 'transpose') {
          [row, col] = [x, y];
        }
        if (fixture.modules[row][col] !== '1') continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = code * (size + gap) + (x + padding) * scale + dx;
            const py = (y + padding) * scale + dy;
            const index = (py * width + px) * 4;
            data[index] = data[index + 1] = data[index + 2] = 0;
          }
        }
      }
    }
  }
  if (scenario === 'inverted') {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 255 - data[i];
    }
  }
  return { width, height: size, data };
}

async function inspectScenario(scenario) {
  // Use the project's compiler without adding a test runner or changing source imports.
  const ts = require('typescript');
  require.extensions['.ts'] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
    });
    module._compile(outputText, filename);
  };

  const { inspect } = require('../src/app/core.ts');
  const { DefaultInspectionConfig } = require('../src/app/types.ts');
  const image = makeImage(scenario);
  global.window = {};
  // Single-QR cases use the real decoder with mocked image/canvas boundaries.
  global.Image = class {
    constructor() {
      this.width = image.width;
      this.height = image.height;
    }
    set src(value) {
      queueMicrotask(() => this.onload());
    }
  };
  global.document = {
    createElement(tag) {
      assert.equal(tag, 'canvas');
      return {
        getContext() {
          return {
            drawImage() {},
            getImageData() { return { data: image.data }; },
          };
        },
      };
    },
  };
  URL.createObjectURL = () => 'fixture:qr';

  let decodeCalls = 0;
  if (scenario.includes('pair')) {
    const { QRCodeReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, ResultPoint,
      NotFoundException } = require('../zxing-js/src/index.ts');
    const single = makeImage('horizontal');
    const luminances = new Uint8ClampedArray(single.width * single.height);
    for (let i = 0; i < luminances.length; i++) luminances[i] = single.data[i * 4];
    const decoded = new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(
      new RGBLuminanceSource(luminances, single.width, single.height))));
    const offset = scenario === 'far-pair' ? single.width * 2 : single.width;
    const detections = [0, offset].map(x => ({
      getResultPoints: () => decoded.getResultPoints().map(point =>
        new ResultPoint(point.getX() + x, point.getY())),
      getResultMetadata: () => decoded.getResultMetadata(),
      getText: () => decoded.getText(),
    }));
    // Isolate proximity inspection from the single-code reader's ambiguous selection
    // between six finder patterns. Coordinates come from an actual mirrored decode.
    QRCodeReader.prototype.decode = function () {
      const result = [detections[0], detections[1], undefined, detections[0]][decodeCalls++];
      if (!result) throw new NotFoundException();
      return result;
    };
  }
  if (scenario === 'no-progress') {
    const { QRCodeReader } = require('../zxing-js/src/index.ts');
    const decode = QRCodeReader.prototype.decode;
    let firstResult;
    // Model a decoder repeatedly reporting the same QR after its interior is erased.
    QRCodeReader.prototype.decode = function (...args) {
      decodeCalls++;
      firstResult ??= decode.apply(this, args);
      return firstResult;
    };
  }

  const result = await inspect(new File([], 'qr.png', { type: 'image/png' }), DefaultInspectionConfig);
  return { codes: result.defects.map(defect => defect.code).sort(), defects: result.defects, decodeCalls };
}

const scenario = process.argv[2];
if (scenario) {
  inspectScenario(scenario).then(result => {
    process.stdout.write(JSON.stringify(result));
  }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  for (const [name, scenario, expected] of [
    ['original QR completes without defects', 'original', []],
    ['horizontal mirror completes and reports QR004', 'horizontal', ['QR004']],
    ['vertical mirror completes and reports QR004', 'vertical', ['QR004']],
    ['transposed QR completes and reports QR004', 'transpose', ['QR004']],
    ['inverted mirror reports both defects', 'inverted', ['QR003', 'QR004']],
    ['nearby mirrored detections retain proximity checking', 'near-pair', ['QR004', 'QR006']],
    ['distant mirrored detections have no proximity defect', 'far-pair', ['QR004']],
    ['unchanged pixels stop repeated detections', 'no-progress', []],
  ]) {
    test(name, () => {
      // A parent-process timeout can stop a synchronous infinite loop in inspection.
      const child = spawnSync(process.execPath, [__filename, scenario], {
        encoding: 'utf8', timeout: 10000, killSignal: 'SIGKILL',
      });
      assert.ifError(child.error);
      assert.equal(child.status, 0, child.stderr);
      const result = JSON.parse(child.stdout);
      assert.deepEqual(result.codes, expected, JSON.stringify(result.defects));
      if (scenario === 'no-progress') assert.equal(result.decodeCalls, 4);
    });
  }
}
