/* tslint:disable:quotemark */

import {assert} from 'chai';
import {COLOR, DETAIL, OPACITY, SIZE, UNIT_CHANNELS} from '../../../src/channel';
import {getPathSort, parseMarkGroup, pathGroupingFields} from '../../../src/compile/mark/mark';
import {UnitModel} from '../../../src/compile/unit';
import {parseFacetModel, parseUnitModel, parseUnitModelWithScale, parseUnitModelWithScaleAndLayoutSize} from '../../util';

describe('Mark', function() {
  describe('parseMarkGroup', function() {
    // PATH
    describe('Multi-series Line', () => {
      it('should have a facet directive and a nested mark group that uses the faceted data.', () => {
        const model = parseUnitModelWithScaleAndLayoutSize({
          "mark": {"type": "line", "style": "trend"},
          "encoding": {
            "x": {"field": "date", "type": "temporal", "axis": {"format": "%Y"}},
            "y": {"field": "price", "type": "quantitative"},
            "color": {"field": "symbol", "type": "nominal"}
          }
        });
        const markGroup = parseMarkGroup(model)[0];
        assert.equal(markGroup.name, 'pathgroup');
        assert.deepEqual(markGroup.from, {
          facet: {
            name: 'faceted_path_main',
            data: 'main',
            groupby: ['symbol']
          }
        });
        const submarkGroup = markGroup.marks[0];
        assert.equal(submarkGroup.name, 'marks');
        assert.equal(submarkGroup.type, 'line');
        assert.deepEqual(submarkGroup.style, ['line', 'trend']);
        assert.equal(submarkGroup.from.data, 'faceted_path_main');
      });
    });

    describe('Single Line', () => {
      it('should have a facet directive and a nested mark group', () => {
        const model = parseUnitModelWithScaleAndLayoutSize({
          "mark": "line",
          "encoding": {
            "x": {"field": "date", "type": "temporal", "axis": {"format": "%Y"}},
            "y": {"field": "price", "type": "quantitative"}
          }
        });
        const markGroup = parseMarkGroup(model)[0];
        assert.equal(markGroup.name, 'marks');
        assert.equal(markGroup.type, 'line');
        assert.equal(markGroup.from.data, 'main');
      });
    });

    // NON-PATH
    describe('Aggregated Bar with a color with binned x', () => {
      it(' should use main stacked data source', () => {
        const model = parseUnitModelWithScaleAndLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"},
            "color": {"type": "ordinal", "field": "Effect__Amount_of_damage"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.equal(markGroup[0].from.data, 'main');
        assert.equal(markGroup[0].style, 'bar');
      });
    });

    describe('Faceted aggregated Bar with a color with binned x', () => {
      it('should use faceted data source', () => {
        const model = parseFacetModel({
          facet: {
            row: {field: 'a', type: 'nominal'}
          },
          spec: {
            "mark": "bar",
            "encoding": {
              "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
              "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"},
              "color": {"type": "ordinal", "field": "Effect__Amount_of_damage"}
            }
          }
        });
        model.parseScale();
        model.parseLayoutSize();

        const markGroup = parseMarkGroup(model.child as UnitModel);
        assert.equal(markGroup[0].from.data, 'child_main');
      });
    });

    describe('Aggregated bar', () => {
      it('should use main aggregated data source', () => {
        const model = parseUnitModelWithScaleAndLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.equal(markGroup[0].from.data, 'main');
      });
    });

    describe('Bar with tooltip', () => {
      it('should pass tooltip value to encoding', () => {
        const model = parseUnitModelWithScaleAndLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"},
            "tooltip": {"value": "foo"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.equal(markGroup[0].encode.update.tooltip.value, 'foo');
      });
    });
  });

  describe('getPathSort', () => {
    describe('compileUnit', function() {
      it('should order by order field for line with order (connected scatterplot)', function () {
        const model = parseUnitModel({
          "data": {"url": "data/driving.json"},
          "mark": "line",
          "encoding": {
            "x": {"field": "miles","type": "quantitative", "scale": {"zero": false}},
            "y": {"field": "gas","type": "quantitative", "scale": {"zero": false}},
            "order": {"field": "year","type": "temporal"}
          }
        });
        assert.deepEqual(getPathSort(model), {
          field: ['datum[\"year\"]'],
          order: ['ascending']
        });
      });

      it('should order by x by default if x is the dimension', function () {
        const model = parseUnitModelWithScale({
          "data": {"url": "data/movies.json"},
          "mark": "line",
          "encoding": {
            "x": {
              "bin": {"maxbins": 10},
              "field": "IMDB_Rating",
              "type": "quantitative"
            },
            "color": {
              "field": "Source",
              "type": "nominal"
            },
            "y": {
              "aggregate": "count",
              "type": "quantitative"
            }
          }
        });
        assert.deepEqual(getPathSort(model), {
          field: 'datum[\"bin_maxbins_10_IMDB_Rating\"]',
          order: 'descending'
        });
      });

      it('should not order by a missing dimension', function () {
        const model = parseUnitModelWithScale({
          "data": {"url": "data/movies.json"},
          "mark": "line",
          "encoding": {
            "color": {
              "field": "Source",
              "type": "nominal"
            },
            "y": {
              "aggregate": "count",
              "type": "quantitative"
            }
          }
        });
        assert.deepEqual(getPathSort(model), undefined);
      });
    });
  });

  describe('pathGroupingFields', () => {
    it('should return fields for unaggregate detail, color, size, opacity fieldDefs.', () => {
      for (const channel of [DETAIL, COLOR, SIZE, OPACITY]) {
        assert.deepEqual(
          pathGroupingFields({[channel]: {field: 'a', type: 'nominal'}}),
          ['a']
        );
      }
    });

    it('should not return fields for unaggregate detail, color, size, opacity fieldDefs.', () => {
      for (const channel of [DETAIL, COLOR, SIZE, OPACITY]) {
        assert.deepEqual(
          pathGroupingFields({[channel]: {aggregate: 'mean', field: 'a', type: 'nominal'}}),
          []
        );
      }
    });

    it('should return condition detail fields for color, size, shape', () => {
      for (const channel of [COLOR, SIZE, OPACITY]) {
        assert.deepEqual(
          pathGroupingFields({[channel]: {
            condition: {selection: 'sel', field: 'a', type: 'nominal'}
          }}),
          ['a']
        );
      }
    });

    it('should not return errors for all channels', () => {
      for (const channel of UNIT_CHANNELS) {
        assert.doesNotThrow(
          () => {
            pathGroupingFields({
              [channel]: {field: 'a', type: 'nominal'}
            });
          }
        );
      }
    });
  });
});
