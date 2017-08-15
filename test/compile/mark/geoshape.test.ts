/* tslint:disable quotemark */

import {assert} from 'chai';
import {geoshape} from '../../../src/compile/mark/geoshape';
import {parseUnitModelWithScaleMarkDefLayoutSize} from '../../util';

describe('Mark: Geoshape', function() {
  describe('encode', function () {
    it('should create no properties', () => {
      const model = parseUnitModelWithScaleMarkDefLayoutSize({
        "mark": "geoshape",
        "projection": {
          "type": "albersUsa"
        },
        "data": {
          "url": "data/us-10m.json",
          "format": {
            "type": "topojson",
            "feature": "states"
          }
        },
        "encoding": {
          "color": {
            "value": "black"
          },
          "opacity": {
            "value": 0.8
          }
        }
      });
      const props = geoshape.encodeEntry(model);
      assert.deepEqual({
        "fill": {
          "value": "black"
        },
        "opacity": {
          "value": 0.8
        }
      }, props);
    });
  });
});
