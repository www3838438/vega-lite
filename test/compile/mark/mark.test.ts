/* tslint:disable:quotemark */

import {assert} from 'chai';

import {getPathSort, parseMarkGroup} from '../../../src/compile/mark/mark';
import {UnitModel} from '../../../src/compile/unit';
import {GEOSHAPE} from '../../../src/mark';
import {parseFacetModel, parseUnitModel, parseUnitModelWithScale, parseUnitModelWithScaleMarkDefLayoutSize} from '../../util';

describe('Mark', function() {
  describe('parseMarkGroup', function() {
    // PATH
    describe('Multi-series Line', () => {
      it('should have a facet directive and a nested mark group that uses the faceted data.', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
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
        const submarkGroup = markGroup.marks;
        assert.equal(submarkGroup[0].name, 'marks');
        assert.equal(submarkGroup[0].type, 'line');
        assert.equal(submarkGroup[0].style, 'trend');
        assert.equal(submarkGroup[0].from.data, 'faceted_path_main');
      });

      it('should not have post encoding transform', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
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
        const submarkGroup = markGroup.marks;
        assert.isUndefined(submarkGroup[0].transform);
      });
    });

    describe('Single Line', () => {
      it('should have a facet directive and a nested mark group', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
          "mark": "line",
          "encoding": {
            "x": {"field": "date", "type": "temporal", "axis": {"format": "%Y"}},
            "y": {"field": "price", "type": "quantitative"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.equal(markGroup[0].name, 'marks');
        assert.equal(markGroup[0].type, 'line');
        assert.equal(markGroup[0].from.data, 'main');
      });

      it('should not have post encoding transform', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
          "mark": "line",
          "encoding": {
            "x": {"field": "date", "type": "temporal", "axis": {"format": "%Y"}},
            "y": {"field": "price", "type": "quantitative"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.isUndefined(markGroup[0].transform);
      });
    });

    // NON-PATH
    describe('Geoshape', () => {
      it('should have post encoding transform', () => {
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
          "encoding": {}
        });
        const markGroup = parseMarkGroup(model);
        assert.isDefined(markGroup[0].transform);
        assert.equal(markGroup[0].transform[0].type, GEOSHAPE);
      });
    });

    describe('Aggregated Bar with a color with binned x', () => {
      it(' should use main stacked data source', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
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

      it('should not have post encoding transform', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"},
            "color": {"type": "ordinal", "field": "Effect__Amount_of_damage"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.isUndefined(markGroup[0].transform);
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

      it('should not have post encoding transform', () => {
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
        assert.isUndefined(markGroup[0].transform);
      });
    });

    describe('Aggregated bar', () => {
      it('should use main aggregated data source', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.equal(markGroup[0].from.data, 'main');
      });

      it('should not have post encoding transform', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.isUndefined(markGroup[0].transform);
      });
    });

    describe('Bar with tooltip', () => {
      it('should pass tooltip value to encoding', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
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

      it('should not have post encoding transform', () => {
        const model = parseUnitModelWithScaleMarkDefLayoutSize({
          "mark": "bar",
          "encoding": {
            "x": {"type": "quantitative", "field": "Cost__Other", "aggregate": "sum"},
            "y": {"bin": true, "type": "quantitative", "field": "Cost__Total_$"},
            "tooltip": {"value": "foo"}
          }
        });
        const markGroup = parseMarkGroup(model);
        assert.isUndefined(markGroup[0].transform);
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
});
