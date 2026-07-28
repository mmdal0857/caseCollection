var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// game-data-pack-v2-validator.raw.js
var validate = validate20;
var game_data_pack_v2_validator_raw_default = validate20;
var schema31 = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "case-collection/game-data-pack@2", "title": "\uAC8C\uC784 \uB370\uC774\uD130 \uD329 v2", "type": "object", "required": ["format", "formatVersion", "id", "mergeMode", "provenance"], "additionalProperties": false, "properties": { "format": { "const": "game-data-pack" }, "formatVersion": { "const": 2 }, "id": { "type": "string", "pattern": "^[a-z][a-z0-9_.-]*$" }, "name": { "type": "string" }, "version": { "type": "string" }, "mergeMode": { "enum": ["base", "alongside", "promotion"] }, "promotionTargets": { "type": "array", "items": { "$ref": "#/$defs/promotionTarget" }, "uniqueItems": true }, "provenance": { "$ref": "#/$defs/packProvenance" }, "clues": { "type": "object", "additionalProperties": { "$ref": "game-data-pack@1#/$defs/clue" } }, "patterns": { "type": "object", "additionalProperties": { "$ref": "game-data-pack@1#/$defs/pattern" } }, "hintDefs": { "type": "object", "additionalProperties": { "$ref": "game-data-pack@1#/$defs/hintDef" } }, "cases": { "type": "array", "items": { "$ref": "game-data-pack@1#/$defs/case" } }, "run": { "$ref": "game-data-pack@1#/$defs/run" }, "interludes": { "type": "array", "items": { "$ref": "#/$defs/interludeDefinition" } }, "endings": { "type": "array", "items": { "$ref": "#/$defs/endingDefinition" } } }, "$defs": { "promotionTarget": { "type": "object", "required": ["kind", "id", "expectedSourcePack"], "additionalProperties": false, "properties": { "kind": { "enum": ["clue", "pattern", "hint", "case", "run", "interlude", "ending"] }, "id": { "type": "string", "minLength": 1 }, "expectedSourcePack": { "type": "string", "minLength": 1 } } }, "packProvenance": { "type": "object", "required": ["sourceSnapshotIds", "inputSha256", "validatorVersion", "outputSha256"], "additionalProperties": false, "properties": { "sourceSnapshotIds": { "type": "array", "items": { "type": "string", "minLength": 1 }, "uniqueItems": true }, "inputSha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" }, "modelId": { "type": "string" }, "promptVersion": { "type": "string" }, "seed": { "type": "integer" }, "rawResponseSha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" }, "validatorVersion": { "type": "string", "minLength": 1 }, "outputSha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" } } }, "interludeDefinition": { "type": "object", "required": ["id", "afterCaseId", "beforeCaseId", "apBudget", "actions", "presentation", "provenance"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "afterCaseId": { "type": "string", "minLength": 1 }, "beforeCaseId": { "type": "string", "minLength": 1 }, "apBudget": { "const": 2 }, "actions": { "type": "array", "minItems": 3, "maxItems": 3, "items": { "oneOf": [{ "$ref": "#/$defs/reconAction" }, { "$ref": "#/$defs/interviewAction" }, { "$ref": "#/$defs/stabilizeAction" }] } }, "presentation": { "type": "string", "minLength": 1 }, "provenance": { "$ref": "#/$defs/packProvenance" } } }, "reconAction": { "type": "object", "required": ["id", "kind", "cost", "label", "resultText", "revealKind", "revealValue"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "kind": { "const": "recon" }, "cost": { "const": 1 }, "label": { "type": "string", "minLength": 1 }, "resultText": { "type": "string", "minLength": 1 }, "revealKind": { "enum": ["background", "frame", "risk"] }, "revealValue": { "type": "string", "minLength": 1 } } }, "interviewAction": { "type": "object", "required": ["id", "kind", "cost", "label", "resultText", "guestFacetKey"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "kind": { "const": "interview" }, "cost": { "const": 1 }, "label": { "type": "string", "minLength": 1 }, "resultText": { "type": "string", "minLength": 1 }, "guestFacetKey": { "type": "string", "pattern": "^[^:]+:[^:]+$" } } }, "stabilizeAction": { "type": "object", "required": ["id", "kind", "cost", "label", "resultText", "stat", "delta"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "kind": { "const": "stabilize" }, "cost": { "const": 1 }, "label": { "type": "string", "minLength": 1 }, "resultText": { "type": "string", "minLength": 1 }, "stat": { "enum": ["heat", "trust"] }, "delta": { "type": "number", "not": { "const": 0 } } } }, "endingDefinition": { "type": "object", "required": ["id", "triggerRuleId", "warningRuleId", "presentation", "provenance"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "triggerRuleId": { "enum": ["bad-press", "bad-collapse"] }, "warningRuleId": { "enum": ["press", "collapse"] }, "presentation": { "type": "string", "minLength": 1 }, "provenance": { "$ref": "#/$defs/packProvenance" } } } } };
var schema32 = { "type": "object", "required": ["kind", "id", "expectedSourcePack"], "additionalProperties": false, "properties": { "kind": { "enum": ["clue", "pattern", "hint", "case", "run", "interlude", "ending"] }, "id": { "type": "string", "minLength": 1 }, "expectedSourcePack": { "type": "string", "minLength": 1 } } };
var func1 = Object.prototype.hasOwnProperty;
var func2 = require_ucs2length().default;
var func0 = require_equal().default;
var pattern4 = new RegExp("^[a-z][a-z0-9_.-]*$", "u");
var pattern5 = new RegExp("^[a-f0-9]{64}$", "u");
var schema36 = { "enum": ["physical", "behavioral", "documentary", "forensic"], "description": "\uB2E8\uC11C \uC288\uD2B8." };
var schema37 = { "enum": ["\uC0AC\uB78C", "\uC0AC\uBB3C", "\uD589\uC704", "\uAE30\uB85D", "\uD604\uC0C1"], "description": "\uC874\uC7AC \uBC94\uC8FC \u2014 \uB4DC\uB77C\uB9C8\uD22C\uB974\uAE30\xB7\uC2AC\uB86F \uBD80\uC870\uD654 \uD310\uC815\uC758 \uCD95." };
var schema38 = { "enum": ["\uACF5\uAC1C", "\uC740\uBC00", "\uAC15\uC555", "\uC2E0\uC911", "\uB17C\uB9AC"], "description": "\uBB38\uB9E5 \uD0DC\uADF8(\uD2F0\uCF13 12) \u2014 \uC5BC\uAD74 \uB2E8\uC704\uB85C \uBD99\uC5B4 \uBC30\uACBD \uC0C1\uD0DC \uD2B8\uB799\uC744 \uBBFC\uB2E4." };
var schema40 = { "enum": ["route", "means", "trace", "action", "motive", "record", "omission", "scene", "identity"], "description": "\uCD94\uB9AC\uC801 \uC5ED\uD560 \u2014 \uC5BC\uAD74\uACFC \uC2AC\uB86F\uC774 \uACF5\uC720\uD558\uB294 \uCD95." };
var schema42 = { "type": "object", "required": ["stat", "why"], "additionalProperties": false, "properties": { "stat": { "enum": ["heat", "trust", "axis"] }, "gte": { "type": "number" }, "lt": { "type": "number" }, "why": { "type": "string", "description": "\uC65C \uB9C9\uD614\uB294\uC9C0 \u2014 \uD50C\uB808\uC774\uC5B4\uC5D0\uAC8C \uADF8\uB300\uB85C \uBCF4\uC5EC\uC900\uB2E4." } } };
var pattern9 = new RegExp("^[^:]+:[^:]+$", "u");
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate23.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.key === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "key" }, message: "must have required property 'key'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.frame === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "frame" }, message: "must have required property 'frame'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.meaning === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "meaning" }, message: "must have required property 'meaning'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.tags === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tags" }, message: "must have required property 'tags'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.note === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "note" }, message: "must have required property 'note'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "key" || key0 === "frame" || key0 === "meaning" || key0 === "tags" || key0 === "note" || key0 === "gate" || key0 === "needsPrev" || key0 === "line")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.key !== void 0) {
      let data0 = data.key;
      if (typeof data0 === "string") {
        if (!pattern9.test(data0)) {
          const err6 = { instancePath: instancePath + "/key", schemaPath: "#/properties/key/pattern", keyword: "pattern", params: { pattern: "^[^:]+:[^:]+$" }, message: 'must match pattern "^[^:]+:[^:]+$"' };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/key", schemaPath: "#/properties/key/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.frame !== void 0) {
      let data1 = data.frame;
      if (!(data1 === "route" || data1 === "means" || data1 === "trace" || data1 === "action" || data1 === "motive" || data1 === "record" || data1 === "omission" || data1 === "scene" || data1 === "identity")) {
        const err8 = { instancePath: instancePath + "/frame", schemaPath: "#/$defs/frame/enum", keyword: "enum", params: { allowedValues: schema40.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.meaning !== void 0) {
      if (typeof data.meaning !== "string") {
        const err9 = { instancePath: instancePath + "/meaning", schemaPath: "#/properties/meaning/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.tags !== void 0) {
      let data3 = data.tags;
      if (Array.isArray(data3)) {
        const len0 = data3.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data4 = data3[i0];
          if (!(data4 === "\uACF5\uAC1C" || data4 === "\uC740\uBC00" || data4 === "\uAC15\uC555" || data4 === "\uC2E0\uC911" || data4 === "\uB17C\uB9AC")) {
            const err10 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/$defs/tag/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        }
      } else {
        const err11 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.note !== void 0) {
      if (typeof data.note !== "string") {
        const err12 = { instancePath: instancePath + "/note", schemaPath: "#/properties/note/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.gate !== void 0) {
      let data6 = data.gate;
      if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
        if (data6.stat === void 0) {
          const err13 = { instancePath: instancePath + "/gate", schemaPath: "#/$defs/facetGate/required", keyword: "required", params: { missingProperty: "stat" }, message: "must have required property 'stat'" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        if (data6.why === void 0) {
          const err14 = { instancePath: instancePath + "/gate", schemaPath: "#/$defs/facetGate/required", keyword: "required", params: { missingProperty: "why" }, message: "must have required property 'why'" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        for (const key1 in data6) {
          if (!(key1 === "stat" || key1 === "gte" || key1 === "lt" || key1 === "why")) {
            const err15 = { instancePath: instancePath + "/gate", schemaPath: "#/$defs/facetGate/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
        if (data6.stat !== void 0) {
          let data7 = data6.stat;
          if (!(data7 === "heat" || data7 === "trust" || data7 === "axis")) {
            const err16 = { instancePath: instancePath + "/gate/stat", schemaPath: "#/$defs/facetGate/properties/stat/enum", keyword: "enum", params: { allowedValues: schema42.properties.stat.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data6.gte !== void 0) {
          let data8 = data6.gte;
          if (!(typeof data8 == "number" && isFinite(data8))) {
            const err17 = { instancePath: instancePath + "/gate/gte", schemaPath: "#/$defs/facetGate/properties/gte/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        }
        if (data6.lt !== void 0) {
          let data9 = data6.lt;
          if (!(typeof data9 == "number" && isFinite(data9))) {
            const err18 = { instancePath: instancePath + "/gate/lt", schemaPath: "#/$defs/facetGate/properties/lt/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
        if (data6.why !== void 0) {
          if (typeof data6.why !== "string") {
            const err19 = { instancePath: instancePath + "/gate/why", schemaPath: "#/$defs/facetGate/properties/why/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      } else {
        const err20 = { instancePath: instancePath + "/gate", schemaPath: "#/$defs/facetGate/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.needsPrev !== void 0) {
      let data11 = data.needsPrev;
      if (Array.isArray(data11)) {
        const len1 = data11.length;
        for (let i1 = 0; i1 < len1; i1++) {
          let data12 = data11[i1];
          if (!(data12 === "route" || data12 === "means" || data12 === "trace" || data12 === "action" || data12 === "motive" || data12 === "record" || data12 === "omission" || data12 === "scene" || data12 === "identity")) {
            const err21 = { instancePath: instancePath + "/needsPrev/" + i1, schemaPath: "#/$defs/frame/enum", keyword: "enum", params: { allowedValues: schema40.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
      } else {
        const err22 = { instancePath: instancePath + "/needsPrev", schemaPath: "#/properties/needsPrev/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
    if (data.line !== void 0) {
      if (typeof data.line !== "string") {
        const err23 = { instancePath: instancePath + "/line", schemaPath: "#/properties/line/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
  } else {
    const err24 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err24];
    } else {
      vErrors.push(err24);
    }
    errors++;
  }
  validate23.errors = vErrors;
  return errors === 0;
}
validate23.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate36(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate36.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.name === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.suit === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "suit" }, message: "must have required property 'suit'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.kind === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.tags === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "tags" }, message: "must have required property 'tags'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.text === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.facets === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "facets" }, message: "must have required property 'facets'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "name" || key0 === "suit" || key0 === "kind" || key0 === "tags" || key0 === "text" || key0 === "facets")) {
        const err7 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (typeof data.id !== "string") {
        const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.name !== void 0) {
      if (typeof data.name !== "string") {
        const err9 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.suit !== void 0) {
      let data2 = data.suit;
      if (!(data2 === "physical" || data2 === "behavioral" || data2 === "documentary" || data2 === "forensic")) {
        const err10 = { instancePath: instancePath + "/suit", schemaPath: "#/$defs/suit/enum", keyword: "enum", params: { allowedValues: schema36.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.kind !== void 0) {
      let data3 = data.kind;
      if (!(data3 === "\uC0AC\uB78C" || data3 === "\uC0AC\uBB3C" || data3 === "\uD589\uC704" || data3 === "\uAE30\uB85D" || data3 === "\uD604\uC0C1")) {
        const err11 = { instancePath: instancePath + "/kind", schemaPath: "#/$defs/kind/enum", keyword: "enum", params: { allowedValues: schema37.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.tags !== void 0) {
      let data4 = data.tags;
      if (Array.isArray(data4)) {
        const len0 = data4.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data5 = data4[i0];
          if (!(data5 === "\uACF5\uAC1C" || data5 === "\uC740\uBC00" || data5 === "\uAC15\uC555" || data5 === "\uC2E0\uC911" || data5 === "\uB17C\uB9AC")) {
            const err12 = { instancePath: instancePath + "/tags/" + i0, schemaPath: "#/$defs/tag/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      } else {
        const err13 = { instancePath: instancePath + "/tags", schemaPath: "#/properties/tags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.text !== void 0) {
      if (typeof data.text !== "string") {
        const err14 = { instancePath: instancePath + "/text", schemaPath: "#/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.facets !== void 0) {
      let data7 = data.facets;
      if (Array.isArray(data7)) {
        if (data7.length < 1) {
          const err15 = { instancePath: instancePath + "/facets", schemaPath: "#/properties/facets/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        const len1 = data7.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate23(data7[i1], { instancePath: instancePath + "/facets/" + i1, parentData: data7, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err16 = { instancePath: instancePath + "/facets", schemaPath: "#/properties/facets/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  } else {
    const err17 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err17];
    } else {
      vErrors.push(err17);
    }
    errors++;
  }
  validate36.errors = vErrors;
  return errors === 0;
}
validate36.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema46 = { "type": "object", "required": ["id", "title", "intro", "pieces", "slots", "patterns", "guestClues", "packPool"], "additionalProperties": false, "properties": { "id": { "type": "string" }, "title": { "type": "string" }, "intro": { "type": "string" }, "teaser": { "type": "string" }, "contextHint": { "type": "string" }, "pieces": { "type": "array", "items": { "type": "string" }, "description": "\uCD94\uB9AC\uBB38 \uC870\uAC01 \u2014 slots.length + 1\uAC1C(\uB85C\uB354\uAC00 \uC9D1\uD589)." }, "slots": { "type": "array", "items": { "$ref": "#/$defs/slot" }, "minItems": 1 }, "patterns": { "type": "array", "items": { "type": "string" }, "minItems": 1 }, "guestClues": { "type": "array", "items": { "type": "string" } }, "guestPattern": { "type": "string" }, "guestFacets": { "type": "array", "items": { "type": "string", "pattern": "^[^:]+:[^:]+$" }, "description": "\uAC8C\uC2A4\uD2B8\uAC00 \uC774 \uC0AC\uAC74\uC5D0\uC11C\uB9CC \uBE4C\uB824\uC8FC\uB294 \uC5BC\uAD74 key \u2014 \uBCD1\uD569 \uD6C4 \uD574\uB2F9 \uCE74\uB4DC\uC758 \uC2E4\uC81C \uC5BC\uAD74\uC774\uC5B4\uC57C \uD55C\uB2E4." }, "axis": { "$ref": "#/$defs/axis" }, "packPool": { "type": "array", "items": { "type": "string" } }, "misfits": { "type": "object", "additionalProperties": { "type": "object", "additionalProperties": { "type": "string" } }, "description": "misfits[slotId][cardId] = \uC190\uC218 \uBC18\uC751 \uBB38\uC7A5." } } };
var schema48 = { "type": "object", "required": ["stat", "gte", "then", "else"], "additionalProperties": false, "properties": { "stat": { "enum": ["heat", "trust"] }, "gte": { "type": "number" }, "then": { "type": "string" }, "else": { "type": "string" } }, "description": "\uBC30\uACBD \uC0C1\uD0DC \uC870\uAC74\uBD80 \uC815\uB2F5 \u2014 then/else \uB458 \uB2E4 \uBCD1\uD569 \uD6C4 clues\uC5D0 \uC874\uC7AC\uD574\uC57C \uD55C\uB2E4." };
var schema53 = { "enum": ["\uC774\uAC00", "\uC740\uB294", "\uC744\uB97C", "\uC73C\uB85C", "\uC640\uACFC", "\uC774\uB2E4"], "description": "\uC2AC\uB86F \uC9C1\uD6C4 \uB80C\uB354\uB420 \uD55C\uAD6D\uC5B4 \uC870\uC0AC \uC720\uD615(\uD2F0\uCF13 19) \u2014 src/lib/josa.ts\uC758 JosaKind\uC640 \uB3D9\uAE30\uD654." };
function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate28.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.frame === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "frame" }, message: "must have required property 'frame'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "frame" || key0 === "noun" || key0 === "avoidTags" || key0 === "quality" || key0 === "accepts")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.frame !== void 0) {
      let data0 = data.frame;
      if (!(data0 === "route" || data0 === "means" || data0 === "trace" || data0 === "action" || data0 === "motive" || data0 === "record" || data0 === "omission" || data0 === "scene" || data0 === "identity")) {
        const err2 = { instancePath: instancePath + "/frame", schemaPath: "#/$defs/frame/enum", keyword: "enum", params: { allowedValues: schema40.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.noun !== void 0) {
      if (typeof data.noun !== "string") {
        const err3 = { instancePath: instancePath + "/noun", schemaPath: "#/properties/noun/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.avoidTags !== void 0) {
      let data2 = data.avoidTags;
      if (Array.isArray(data2)) {
        const len0 = data2.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data3 = data2[i0];
          if (!(data3 === "\uACF5\uAC1C" || data3 === "\uC740\uBC00" || data3 === "\uAC15\uC555" || data3 === "\uC2E0\uC911" || data3 === "\uB17C\uB9AC")) {
            const err4 = { instancePath: instancePath + "/avoidTags/" + i0, schemaPath: "#/$defs/tag/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/avoidTags", schemaPath: "#/properties/avoidTags/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.quality !== void 0) {
      if (typeof data.quality !== "string") {
        const err6 = { instancePath: instancePath + "/quality", schemaPath: "#/properties/quality/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.accepts !== void 0) {
      let data5 = data.accepts;
      if (Array.isArray(data5)) {
        const len1 = data5.length;
        for (let i1 = 0; i1 < len1; i1++) {
          let data6 = data5[i1];
          if (!(data6 === "\uC0AC\uB78C" || data6 === "\uC0AC\uBB3C" || data6 === "\uD589\uC704" || data6 === "\uAE30\uB85D" || data6 === "\uD604\uC0C1")) {
            const err7 = { instancePath: instancePath + "/accepts/" + i1, schemaPath: "#/$defs/kind/enum", keyword: "enum", params: { allowedValues: schema37.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
      } else {
        const err8 = { instancePath: instancePath + "/accepts", schemaPath: "#/properties/accepts/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  } else {
    const err9 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate28.errors = vErrors;
  return errors === 0;
}
validate28.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate27.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.label === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "label" }, message: "must have required property 'label'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.answer === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "answer" }, message: "must have required property 'answer'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "label" || key0 === "answer" || key0 === "hit" || key0 === "role" || key0 === "josaAfter")) {
        const err3 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (typeof data.id !== "string") {
        const err4 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.label !== void 0) {
      if (typeof data.label !== "string") {
        const err5 = { instancePath: instancePath + "/label", schemaPath: "#/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.answer !== void 0) {
      let data2 = data.answer;
      const _errs7 = errors;
      let valid1 = false;
      let passing0 = null;
      const _errs8 = errors;
      if (typeof data2 !== "string") {
        const err6 = { instancePath: instancePath + "/answer", schemaPath: "#/properties/answer/oneOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
      var _valid0 = _errs8 === errors;
      if (_valid0) {
        valid1 = true;
        passing0 = 0;
      }
      const _errs10 = errors;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        if (data2.stat === void 0) {
          const err7 = { instancePath: instancePath + "/answer", schemaPath: "#/$defs/condAnswer/required", keyword: "required", params: { missingProperty: "stat" }, message: "must have required property 'stat'" };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        if (data2.gte === void 0) {
          const err8 = { instancePath: instancePath + "/answer", schemaPath: "#/$defs/condAnswer/required", keyword: "required", params: { missingProperty: "gte" }, message: "must have required property 'gte'" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (data2.then === void 0) {
          const err9 = { instancePath: instancePath + "/answer", schemaPath: "#/$defs/condAnswer/required", keyword: "required", params: { missingProperty: "then" }, message: "must have required property 'then'" };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data2.else === void 0) {
          const err10 = { instancePath: instancePath + "/answer", schemaPath: "#/$defs/condAnswer/required", keyword: "required", params: { missingProperty: "else" }, message: "must have required property 'else'" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data2) {
          if (!(key1 === "stat" || key1 === "gte" || key1 === "then" || key1 === "else")) {
            const err11 = { instancePath: instancePath + "/answer", schemaPath: "#/$defs/condAnswer/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
        if (data2.stat !== void 0) {
          let data3 = data2.stat;
          if (!(data3 === "heat" || data3 === "trust")) {
            const err12 = { instancePath: instancePath + "/answer/stat", schemaPath: "#/$defs/condAnswer/properties/stat/enum", keyword: "enum", params: { allowedValues: schema48.properties.stat.enum }, message: "must be equal to one of the allowed values" };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
        if (data2.gte !== void 0) {
          let data4 = data2.gte;
          if (!(typeof data4 == "number" && isFinite(data4))) {
            const err13 = { instancePath: instancePath + "/answer/gte", schemaPath: "#/$defs/condAnswer/properties/gte/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        if (data2.then !== void 0) {
          if (typeof data2.then !== "string") {
            const err14 = { instancePath: instancePath + "/answer/then", schemaPath: "#/$defs/condAnswer/properties/then/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data2.else !== void 0) {
          if (typeof data2.else !== "string") {
            const err15 = { instancePath: instancePath + "/answer/else", schemaPath: "#/$defs/condAnswer/properties/else/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
      } else {
        const err16 = { instancePath: instancePath + "/answer", schemaPath: "#/$defs/condAnswer/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
      var _valid0 = _errs10 === errors;
      if (_valid0 && valid1) {
        valid1 = false;
        passing0 = [passing0, 1];
      } else {
        if (_valid0) {
          valid1 = true;
          passing0 = 1;
        }
      }
      if (!valid1) {
        const err17 = { instancePath: instancePath + "/answer", schemaPath: "#/properties/answer/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      } else {
        errors = _errs7;
        if (vErrors !== null) {
          if (_errs7) {
            vErrors.length = _errs7;
          } else {
            vErrors = null;
          }
        }
      }
    }
    if (data.hit !== void 0) {
      if (typeof data.hit !== "string") {
        const err18 = { instancePath: instancePath + "/hit", schemaPath: "#/properties/hit/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err18];
        } else {
          vErrors.push(err18);
        }
        errors++;
      }
    }
    if (data.role !== void 0) {
      if (!validate28(data.role, { instancePath: instancePath + "/role", parentData: data, parentDataProperty: "role", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
        errors = vErrors.length;
      }
    }
    if (data.josaAfter !== void 0) {
      let data9 = data.josaAfter;
      if (!(data9 === "\uC774\uAC00" || data9 === "\uC740\uB294" || data9 === "\uC744\uB97C" || data9 === "\uC73C\uB85C" || data9 === "\uC640\uACFC" || data9 === "\uC774\uB2E4")) {
        const err19 = { instancePath: instancePath + "/josaAfter", schemaPath: "#/$defs/josaKind/enum", keyword: "enum", params: { allowedValues: schema53.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err19];
        } else {
          vErrors.push(err19);
        }
        errors++;
      }
    }
  } else {
    const err20 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err20];
    } else {
      vErrors.push(err20);
    }
    errors++;
  }
  validate27.errors = vErrors;
  return errors === 0;
}
validate27.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate31(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate31.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.label === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "label" }, message: "must have required property 'label'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.low === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "low" }, message: "must have required property 'low'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.high === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "high" }, message: "must have required property 'high'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.init === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "init" }, message: "must have required property 'init'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.drivenBy === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "drivenBy" }, message: "must have required property 'drivenBy'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.hint === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "hint" }, message: "must have required property 'hint'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "label" || key0 === "low" || key0 === "high" || key0 === "init" || key0 === "drivenBy" || key0 === "hint")) {
        const err7 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (typeof data.id !== "string") {
        const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.label !== void 0) {
      if (typeof data.label !== "string") {
        const err9 = { instancePath: instancePath + "/label", schemaPath: "#/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.low !== void 0) {
      if (typeof data.low !== "string") {
        const err10 = { instancePath: instancePath + "/low", schemaPath: "#/properties/low/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.high !== void 0) {
      if (typeof data.high !== "string") {
        const err11 = { instancePath: instancePath + "/high", schemaPath: "#/properties/high/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.init !== void 0) {
      let data4 = data.init;
      if (!(typeof data4 == "number" && isFinite(data4))) {
        const err12 = { instancePath: instancePath + "/init", schemaPath: "#/properties/init/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.drivenBy !== void 0) {
      let data5 = data.drivenBy;
      if (!(data5 === "\uACF5\uAC1C" || data5 === "\uC740\uBC00" || data5 === "\uAC15\uC555" || data5 === "\uC2E0\uC911" || data5 === "\uB17C\uB9AC")) {
        const err13 = { instancePath: instancePath + "/drivenBy", schemaPath: "#/$defs/tag/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.hint !== void 0) {
      if (typeof data.hint !== "string") {
        const err14 = { instancePath: instancePath + "/hint", schemaPath: "#/properties/hint/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  } else {
    const err15 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate31.errors = vErrors;
  return errors === 0;
}
validate31.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate39(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate39.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.title === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "title" }, message: "must have required property 'title'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.intro === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "intro" }, message: "must have required property 'intro'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.pieces === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "pieces" }, message: "must have required property 'pieces'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.slots === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "slots" }, message: "must have required property 'slots'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.patterns === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "patterns" }, message: "must have required property 'patterns'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.guestClues === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "guestClues" }, message: "must have required property 'guestClues'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.packPool === void 0) {
      const err7 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "packPool" }, message: "must have required property 'packPool'" };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema46.properties, key0)) {
        const err8 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      if (typeof data.id !== "string") {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.title !== void 0) {
      if (typeof data.title !== "string") {
        const err10 = { instancePath: instancePath + "/title", schemaPath: "#/properties/title/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.intro !== void 0) {
      if (typeof data.intro !== "string") {
        const err11 = { instancePath: instancePath + "/intro", schemaPath: "#/properties/intro/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.teaser !== void 0) {
      if (typeof data.teaser !== "string") {
        const err12 = { instancePath: instancePath + "/teaser", schemaPath: "#/properties/teaser/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.contextHint !== void 0) {
      if (typeof data.contextHint !== "string") {
        const err13 = { instancePath: instancePath + "/contextHint", schemaPath: "#/properties/contextHint/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.pieces !== void 0) {
      let data5 = data.pieces;
      if (Array.isArray(data5)) {
        const len0 = data5.length;
        for (let i0 = 0; i0 < len0; i0++) {
          if (typeof data5[i0] !== "string") {
            const err14 = { instancePath: instancePath + "/pieces/" + i0, schemaPath: "#/properties/pieces/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
      } else {
        const err15 = { instancePath: instancePath + "/pieces", schemaPath: "#/properties/pieces/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err15];
        } else {
          vErrors.push(err15);
        }
        errors++;
      }
    }
    if (data.slots !== void 0) {
      let data7 = data.slots;
      if (Array.isArray(data7)) {
        if (data7.length < 1) {
          const err16 = { instancePath: instancePath + "/slots", schemaPath: "#/properties/slots/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        const len1 = data7.length;
        for (let i1 = 0; i1 < len1; i1++) {
          if (!validate27(data7[i1], { instancePath: instancePath + "/slots/" + i1, parentData: data7, parentDataProperty: i1, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err17 = { instancePath: instancePath + "/slots", schemaPath: "#/properties/slots/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.patterns !== void 0) {
      let data9 = data.patterns;
      if (Array.isArray(data9)) {
        if (data9.length < 1) {
          const err18 = { instancePath: instancePath + "/patterns", schemaPath: "#/properties/patterns/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        const len2 = data9.length;
        for (let i2 = 0; i2 < len2; i2++) {
          if (typeof data9[i2] !== "string") {
            const err19 = { instancePath: instancePath + "/patterns/" + i2, schemaPath: "#/properties/patterns/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      } else {
        const err20 = { instancePath: instancePath + "/patterns", schemaPath: "#/properties/patterns/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    }
    if (data.guestClues !== void 0) {
      let data11 = data.guestClues;
      if (Array.isArray(data11)) {
        const len3 = data11.length;
        for (let i3 = 0; i3 < len3; i3++) {
          if (typeof data11[i3] !== "string") {
            const err21 = { instancePath: instancePath + "/guestClues/" + i3, schemaPath: "#/properties/guestClues/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        }
      } else {
        const err22 = { instancePath: instancePath + "/guestClues", schemaPath: "#/properties/guestClues/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
    if (data.guestPattern !== void 0) {
      if (typeof data.guestPattern !== "string") {
        const err23 = { instancePath: instancePath + "/guestPattern", schemaPath: "#/properties/guestPattern/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    }
    if (data.guestFacets !== void 0) {
      let data14 = data.guestFacets;
      if (Array.isArray(data14)) {
        const len4 = data14.length;
        for (let i4 = 0; i4 < len4; i4++) {
          let data15 = data14[i4];
          if (typeof data15 === "string") {
            if (!pattern9.test(data15)) {
              const err24 = { instancePath: instancePath + "/guestFacets/" + i4, schemaPath: "#/properties/guestFacets/items/pattern", keyword: "pattern", params: { pattern: "^[^:]+:[^:]+$" }, message: 'must match pattern "^[^:]+:[^:]+$"' };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
          } else {
            const err25 = { instancePath: instancePath + "/guestFacets/" + i4, schemaPath: "#/properties/guestFacets/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
      } else {
        const err26 = { instancePath: instancePath + "/guestFacets", schemaPath: "#/properties/guestFacets/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
    if (data.axis !== void 0) {
      if (!validate31(data.axis, { instancePath: instancePath + "/axis", parentData: data, parentDataProperty: "axis", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate31.errors : vErrors.concat(validate31.errors);
        errors = vErrors.length;
      }
    }
    if (data.packPool !== void 0) {
      let data17 = data.packPool;
      if (Array.isArray(data17)) {
        const len5 = data17.length;
        for (let i5 = 0; i5 < len5; i5++) {
          if (typeof data17[i5] !== "string") {
            const err27 = { instancePath: instancePath + "/packPool/" + i5, schemaPath: "#/properties/packPool/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
      } else {
        const err28 = { instancePath: instancePath + "/packPool", schemaPath: "#/properties/packPool/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err28];
        } else {
          vErrors.push(err28);
        }
        errors++;
      }
    }
    if (data.misfits !== void 0) {
      let data19 = data.misfits;
      if (data19 && typeof data19 == "object" && !Array.isArray(data19)) {
        for (const key1 in data19) {
          let data20 = data19[key1];
          if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
            for (const key2 in data20) {
              if (typeof data20[key2] !== "string") {
                const err29 = { instancePath: instancePath + "/misfits/" + key1.replace(/~/g, "~0").replace(/\//g, "~1") + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/misfits/additionalProperties/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err29];
                } else {
                  vErrors.push(err29);
                }
                errors++;
              }
            }
          } else {
            const err30 = { instancePath: instancePath + "/misfits/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/misfits/additionalProperties/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err30];
            } else {
              vErrors.push(err30);
            }
            errors++;
          }
        }
      } else {
        const err31 = { instancePath: instancePath + "/misfits", schemaPath: "#/properties/misfits/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err31];
        } else {
          vErrors.push(err31);
        }
        errors++;
      }
    }
  } else {
    const err32 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err32];
    } else {
      vErrors.push(err32);
    }
    errors++;
  }
  validate39.errors = vErrors;
  return errors === 0;
}
validate39.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema56 = { "type": "object", "additionalProperties": false, "properties": { "interludeEvents": { "type": "array", "items": { "type": "object" }, "description": "\uC778\uD130\uB8E8\uB4DC \uC774\uBCA4\uD2B8 \u2014 \uD504\uB85C\uD1A0 \uB2E8\uACC4\uB77C \uD615\uD0DC\uB97C \uB290\uC2A8\uD788 \uB454\uB2E4. TODO(16): \uACC4\uC57D \uD655\uC815 \uC2DC \uC870\uC778\uB2E4." }, "interludeAP": { "type": "number" }, "interludeActions": { "type": "array", "items": { "type": "object" } }, "starterClues": { "type": "array", "items": { "type": "string" } }, "starterPatterns": { "type": "array", "items": { "type": "string" } }, "starterHints": { "type": "array", "items": { "type": "string" } }, "initial": { "type": "object", "required": ["heat", "trust"], "additionalProperties": false, "properties": { "heat": { "type": "number" }, "trust": { "type": "number" } } }, "tagDeltas": { "type": "object", "propertyNames": { "$ref": "#/$defs/tag" }, "additionalProperties": { "type": "object", "required": ["heat", "trust"], "additionalProperties": false, "properties": { "heat": { "type": "number" }, "trust": { "type": "number" } } } }, "badHeat": { "type": "number" } } };
function validate43(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate43.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      if (!func1.call(schema56.properties, key0)) {
        const err0 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
    if (data.interludeEvents !== void 0) {
      let data0 = data.interludeEvents;
      if (Array.isArray(data0)) {
        const len0 = data0.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data1 = data0[i0];
          if (!(data1 && typeof data1 == "object" && !Array.isArray(data1))) {
            const err1 = { instancePath: instancePath + "/interludeEvents/" + i0, schemaPath: "#/properties/interludeEvents/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
        }
      } else {
        const err2 = { instancePath: instancePath + "/interludeEvents", schemaPath: "#/properties/interludeEvents/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.interludeAP !== void 0) {
      let data2 = data.interludeAP;
      if (!(typeof data2 == "number" && isFinite(data2))) {
        const err3 = { instancePath: instancePath + "/interludeAP", schemaPath: "#/properties/interludeAP/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.interludeActions !== void 0) {
      let data3 = data.interludeActions;
      if (Array.isArray(data3)) {
        const len1 = data3.length;
        for (let i1 = 0; i1 < len1; i1++) {
          let data4 = data3[i1];
          if (!(data4 && typeof data4 == "object" && !Array.isArray(data4))) {
            const err4 = { instancePath: instancePath + "/interludeActions/" + i1, schemaPath: "#/properties/interludeActions/items/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err4];
            } else {
              vErrors.push(err4);
            }
            errors++;
          }
        }
      } else {
        const err5 = { instancePath: instancePath + "/interludeActions", schemaPath: "#/properties/interludeActions/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.starterClues !== void 0) {
      let data5 = data.starterClues;
      if (Array.isArray(data5)) {
        const len2 = data5.length;
        for (let i2 = 0; i2 < len2; i2++) {
          if (typeof data5[i2] !== "string") {
            const err6 = { instancePath: instancePath + "/starterClues/" + i2, schemaPath: "#/properties/starterClues/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
        }
      } else {
        const err7 = { instancePath: instancePath + "/starterClues", schemaPath: "#/properties/starterClues/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.starterPatterns !== void 0) {
      let data7 = data.starterPatterns;
      if (Array.isArray(data7)) {
        const len3 = data7.length;
        for (let i3 = 0; i3 < len3; i3++) {
          if (typeof data7[i3] !== "string") {
            const err8 = { instancePath: instancePath + "/starterPatterns/" + i3, schemaPath: "#/properties/starterPatterns/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      } else {
        const err9 = { instancePath: instancePath + "/starterPatterns", schemaPath: "#/properties/starterPatterns/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.starterHints !== void 0) {
      let data9 = data.starterHints;
      if (Array.isArray(data9)) {
        const len4 = data9.length;
        for (let i4 = 0; i4 < len4; i4++) {
          if (typeof data9[i4] !== "string") {
            const err10 = { instancePath: instancePath + "/starterHints/" + i4, schemaPath: "#/properties/starterHints/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        }
      } else {
        const err11 = { instancePath: instancePath + "/starterHints", schemaPath: "#/properties/starterHints/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.initial !== void 0) {
      let data11 = data.initial;
      if (data11 && typeof data11 == "object" && !Array.isArray(data11)) {
        if (data11.heat === void 0) {
          const err12 = { instancePath: instancePath + "/initial", schemaPath: "#/properties/initial/required", keyword: "required", params: { missingProperty: "heat" }, message: "must have required property 'heat'" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data11.trust === void 0) {
          const err13 = { instancePath: instancePath + "/initial", schemaPath: "#/properties/initial/required", keyword: "required", params: { missingProperty: "trust" }, message: "must have required property 'trust'" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        for (const key1 in data11) {
          if (!(key1 === "heat" || key1 === "trust")) {
            const err14 = { instancePath: instancePath + "/initial", schemaPath: "#/properties/initial/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err14];
            } else {
              vErrors.push(err14);
            }
            errors++;
          }
        }
        if (data11.heat !== void 0) {
          let data12 = data11.heat;
          if (!(typeof data12 == "number" && isFinite(data12))) {
            const err15 = { instancePath: instancePath + "/initial/heat", schemaPath: "#/properties/initial/properties/heat/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        }
        if (data11.trust !== void 0) {
          let data13 = data11.trust;
          if (!(typeof data13 == "number" && isFinite(data13))) {
            const err16 = { instancePath: instancePath + "/initial/trust", schemaPath: "#/properties/initial/properties/trust/type", keyword: "type", params: { type: "number" }, message: "must be number" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
      } else {
        const err17 = { instancePath: instancePath + "/initial", schemaPath: "#/properties/initial/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err17];
        } else {
          vErrors.push(err17);
        }
        errors++;
      }
    }
    if (data.tagDeltas !== void 0) {
      let data14 = data.tagDeltas;
      if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
        for (const key2 in data14) {
          const _errs33 = errors;
          if (!(key2 === "\uACF5\uAC1C" || key2 === "\uC740\uBC00" || key2 === "\uAC15\uC555" || key2 === "\uC2E0\uC911" || key2 === "\uB17C\uB9AC")) {
            const err18 = { instancePath: instancePath + "/tagDeltas", schemaPath: "#/$defs/tag/enum", keyword: "enum", params: { allowedValues: schema38.enum }, message: "must be equal to one of the allowed values", propertyName: key2 };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
          var valid12 = _errs33 === errors;
          if (!valid12) {
            const err19 = { instancePath: instancePath + "/tagDeltas", schemaPath: "#/properties/tagDeltas/propertyNames", keyword: "propertyNames", params: { propertyName: key2 }, message: "property name must be valid" };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
        for (const key3 in data14) {
          let data15 = data14[key3];
          if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
            if (data15.heat === void 0) {
              const err20 = { instancePath: instancePath + "/tagDeltas/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/tagDeltas/additionalProperties/required", keyword: "required", params: { missingProperty: "heat" }, message: "must have required property 'heat'" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data15.trust === void 0) {
              const err21 = { instancePath: instancePath + "/tagDeltas/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/tagDeltas/additionalProperties/required", keyword: "required", params: { missingProperty: "trust" }, message: "must have required property 'trust'" };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
            for (const key4 in data15) {
              if (!(key4 === "heat" || key4 === "trust")) {
                const err22 = { instancePath: instancePath + "/tagDeltas/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/tagDeltas/additionalProperties/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            }
            if (data15.heat !== void 0) {
              let data16 = data15.heat;
              if (!(typeof data16 == "number" && isFinite(data16))) {
                const err23 = { instancePath: instancePath + "/tagDeltas/" + key3.replace(/~/g, "~0").replace(/\//g, "~1") + "/heat", schemaPath: "#/properties/tagDeltas/additionalProperties/properties/heat/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (data15.trust !== void 0) {
              let data17 = data15.trust;
              if (!(typeof data17 == "number" && isFinite(data17))) {
                const err24 = { instancePath: instancePath + "/tagDeltas/" + key3.replace(/~/g, "~0").replace(/\//g, "~1") + "/trust", schemaPath: "#/properties/tagDeltas/additionalProperties/properties/trust/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
            }
          } else {
            const err25 = { instancePath: instancePath + "/tagDeltas/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/properties/tagDeltas/additionalProperties/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
      } else {
        const err26 = { instancePath: instancePath + "/tagDeltas", schemaPath: "#/properties/tagDeltas/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err26];
        } else {
          vErrors.push(err26);
        }
        errors++;
      }
    }
    if (data.badHeat !== void 0) {
      let data18 = data.badHeat;
      if (!(typeof data18 == "number" && isFinite(data18))) {
        const err27 = { instancePath: instancePath + "/badHeat", schemaPath: "#/properties/badHeat/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
  } else {
    const err28 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err28];
    } else {
      vErrors.push(err28);
    }
    errors++;
  }
  validate43.errors = vErrors;
  return errors === 0;
}
validate43.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema68 = { "type": "object", "required": ["id", "kind", "cost", "label", "resultText", "revealKind", "revealValue"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "kind": { "const": "recon" }, "cost": { "const": 1 }, "label": { "type": "string", "minLength": 1 }, "resultText": { "type": "string", "minLength": 1 }, "revealKind": { "enum": ["background", "frame", "risk"] }, "revealValue": { "type": "string", "minLength": 1 } } };
var schema70 = { "type": "object", "required": ["id", "kind", "cost", "label", "resultText", "stat", "delta"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "kind": { "const": "stabilize" }, "cost": { "const": 1 }, "label": { "type": "string", "minLength": 1 }, "resultText": { "type": "string", "minLength": 1 }, "stat": { "enum": ["heat", "trust"] }, "delta": { "type": "number", "not": { "const": 0 } } } };
function validate45(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate45.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.afterCaseId === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "afterCaseId" }, message: "must have required property 'afterCaseId'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.beforeCaseId === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "beforeCaseId" }, message: "must have required property 'beforeCaseId'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.apBudget === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "apBudget" }, message: "must have required property 'apBudget'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.actions === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "actions" }, message: "must have required property 'actions'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    if (data.presentation === void 0) {
      const err5 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "presentation" }, message: "must have required property 'presentation'" };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.provenance === void 0) {
      const err6 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "provenance" }, message: "must have required property 'provenance'" };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "afterCaseId" || key0 === "beforeCaseId" || key0 === "apBudget" || key0 === "actions" || key0 === "presentation" || key0 === "provenance")) {
        const err7 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (func2(data0) < 1) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.afterCaseId !== void 0) {
      let data1 = data.afterCaseId;
      if (typeof data1 === "string") {
        if (func2(data1) < 1) {
          const err10 = { instancePath: instancePath + "/afterCaseId", schemaPath: "#/properties/afterCaseId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/afterCaseId", schemaPath: "#/properties/afterCaseId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.beforeCaseId !== void 0) {
      let data2 = data.beforeCaseId;
      if (typeof data2 === "string") {
        if (func2(data2) < 1) {
          const err12 = { instancePath: instancePath + "/beforeCaseId", schemaPath: "#/properties/beforeCaseId/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
      } else {
        const err13 = { instancePath: instancePath + "/beforeCaseId", schemaPath: "#/properties/beforeCaseId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err13];
        } else {
          vErrors.push(err13);
        }
        errors++;
      }
    }
    if (data.apBudget !== void 0) {
      if (2 !== data.apBudget) {
        const err14 = { instancePath: instancePath + "/apBudget", schemaPath: "#/properties/apBudget/const", keyword: "const", params: { allowedValue: 2 }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
    if (data.actions !== void 0) {
      let data4 = data.actions;
      if (Array.isArray(data4)) {
        if (data4.length > 3) {
          const err15 = { instancePath: instancePath + "/actions", schemaPath: "#/properties/actions/maxItems", keyword: "maxItems", params: { limit: 3 }, message: "must NOT have more than 3 items" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        if (data4.length < 3) {
          const err16 = { instancePath: instancePath + "/actions", schemaPath: "#/properties/actions/minItems", keyword: "minItems", params: { limit: 3 }, message: "must NOT have fewer than 3 items" };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        const len0 = data4.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data5 = data4[i0];
          const _errs12 = errors;
          let valid3 = false;
          let passing0 = null;
          const _errs13 = errors;
          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
            if (data5.id === void 0) {
              const err17 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (data5.kind === void 0) {
              const err18 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (data5.cost === void 0) {
              const err19 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "cost" }, message: "must have required property 'cost'" };
              if (vErrors === null) {
                vErrors = [err19];
              } else {
                vErrors.push(err19);
              }
              errors++;
            }
            if (data5.label === void 0) {
              const err20 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "label" }, message: "must have required property 'label'" };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data5.resultText === void 0) {
              const err21 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "resultText" }, message: "must have required property 'resultText'" };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
            if (data5.revealKind === void 0) {
              const err22 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "revealKind" }, message: "must have required property 'revealKind'" };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
            if (data5.revealValue === void 0) {
              const err23 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/required", keyword: "required", params: { missingProperty: "revealValue" }, message: "must have required property 'revealValue'" };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            for (const key1 in data5) {
              if (!(key1 === "id" || key1 === "kind" || key1 === "cost" || key1 === "label" || key1 === "resultText" || key1 === "revealKind" || key1 === "revealValue")) {
                const err24 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err24];
                } else {
                  vErrors.push(err24);
                }
                errors++;
              }
            }
            if (data5.id !== void 0) {
              let data6 = data5.id;
              if (typeof data6 === "string") {
                if (func2(data6) < 1) {
                  const err25 = { instancePath: instancePath + "/actions/" + i0 + "/id", schemaPath: "#/$defs/reconAction/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                }
              } else {
                const err26 = { instancePath: instancePath + "/actions/" + i0 + "/id", schemaPath: "#/$defs/reconAction/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err26];
                } else {
                  vErrors.push(err26);
                }
                errors++;
              }
            }
            if (data5.kind !== void 0) {
              if ("recon" !== data5.kind) {
                const err27 = { instancePath: instancePath + "/actions/" + i0 + "/kind", schemaPath: "#/$defs/reconAction/properties/kind/const", keyword: "const", params: { allowedValue: "recon" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err27];
                } else {
                  vErrors.push(err27);
                }
                errors++;
              }
            }
            if (data5.cost !== void 0) {
              if (1 !== data5.cost) {
                const err28 = { instancePath: instancePath + "/actions/" + i0 + "/cost", schemaPath: "#/$defs/reconAction/properties/cost/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
            }
            if (data5.label !== void 0) {
              let data9 = data5.label;
              if (typeof data9 === "string") {
                if (func2(data9) < 1) {
                  const err29 = { instancePath: instancePath + "/actions/" + i0 + "/label", schemaPath: "#/$defs/reconAction/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err29];
                  } else {
                    vErrors.push(err29);
                  }
                  errors++;
                }
              } else {
                const err30 = { instancePath: instancePath + "/actions/" + i0 + "/label", schemaPath: "#/$defs/reconAction/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err30];
                } else {
                  vErrors.push(err30);
                }
                errors++;
              }
            }
            if (data5.resultText !== void 0) {
              let data10 = data5.resultText;
              if (typeof data10 === "string") {
                if (func2(data10) < 1) {
                  const err31 = { instancePath: instancePath + "/actions/" + i0 + "/resultText", schemaPath: "#/$defs/reconAction/properties/resultText/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
              } else {
                const err32 = { instancePath: instancePath + "/actions/" + i0 + "/resultText", schemaPath: "#/$defs/reconAction/properties/resultText/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err32];
                } else {
                  vErrors.push(err32);
                }
                errors++;
              }
            }
            if (data5.revealKind !== void 0) {
              let data11 = data5.revealKind;
              if (!(data11 === "background" || data11 === "frame" || data11 === "risk")) {
                const err33 = { instancePath: instancePath + "/actions/" + i0 + "/revealKind", schemaPath: "#/$defs/reconAction/properties/revealKind/enum", keyword: "enum", params: { allowedValues: schema68.properties.revealKind.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err33];
                } else {
                  vErrors.push(err33);
                }
                errors++;
              }
            }
            if (data5.revealValue !== void 0) {
              let data12 = data5.revealValue;
              if (typeof data12 === "string") {
                if (func2(data12) < 1) {
                  const err34 = { instancePath: instancePath + "/actions/" + i0 + "/revealValue", schemaPath: "#/$defs/reconAction/properties/revealValue/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
              } else {
                const err35 = { instancePath: instancePath + "/actions/" + i0 + "/revealValue", schemaPath: "#/$defs/reconAction/properties/revealValue/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err35];
                } else {
                  vErrors.push(err35);
                }
                errors++;
              }
            }
          } else {
            const err36 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/reconAction/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err36];
            } else {
              vErrors.push(err36);
            }
            errors++;
          }
          var _valid0 = _errs13 === errors;
          if (_valid0) {
            valid3 = true;
            passing0 = 0;
            var props0 = true;
          }
          const _errs28 = errors;
          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
            if (data5.id === void 0) {
              const err37 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err37];
              } else {
                vErrors.push(err37);
              }
              errors++;
            }
            if (data5.kind === void 0) {
              const err38 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
              if (vErrors === null) {
                vErrors = [err38];
              } else {
                vErrors.push(err38);
              }
              errors++;
            }
            if (data5.cost === void 0) {
              const err39 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/required", keyword: "required", params: { missingProperty: "cost" }, message: "must have required property 'cost'" };
              if (vErrors === null) {
                vErrors = [err39];
              } else {
                vErrors.push(err39);
              }
              errors++;
            }
            if (data5.label === void 0) {
              const err40 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/required", keyword: "required", params: { missingProperty: "label" }, message: "must have required property 'label'" };
              if (vErrors === null) {
                vErrors = [err40];
              } else {
                vErrors.push(err40);
              }
              errors++;
            }
            if (data5.resultText === void 0) {
              const err41 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/required", keyword: "required", params: { missingProperty: "resultText" }, message: "must have required property 'resultText'" };
              if (vErrors === null) {
                vErrors = [err41];
              } else {
                vErrors.push(err41);
              }
              errors++;
            }
            if (data5.guestFacetKey === void 0) {
              const err42 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/required", keyword: "required", params: { missingProperty: "guestFacetKey" }, message: "must have required property 'guestFacetKey'" };
              if (vErrors === null) {
                vErrors = [err42];
              } else {
                vErrors.push(err42);
              }
              errors++;
            }
            for (const key2 in data5) {
              if (!(key2 === "id" || key2 === "kind" || key2 === "cost" || key2 === "label" || key2 === "resultText" || key2 === "guestFacetKey")) {
                const err43 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err43];
                } else {
                  vErrors.push(err43);
                }
                errors++;
              }
            }
            if (data5.id !== void 0) {
              let data13 = data5.id;
              if (typeof data13 === "string") {
                if (func2(data13) < 1) {
                  const err44 = { instancePath: instancePath + "/actions/" + i0 + "/id", schemaPath: "#/$defs/interviewAction/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err44];
                  } else {
                    vErrors.push(err44);
                  }
                  errors++;
                }
              } else {
                const err45 = { instancePath: instancePath + "/actions/" + i0 + "/id", schemaPath: "#/$defs/interviewAction/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err45];
                } else {
                  vErrors.push(err45);
                }
                errors++;
              }
            }
            if (data5.kind !== void 0) {
              if ("interview" !== data5.kind) {
                const err46 = { instancePath: instancePath + "/actions/" + i0 + "/kind", schemaPath: "#/$defs/interviewAction/properties/kind/const", keyword: "const", params: { allowedValue: "interview" }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err46];
                } else {
                  vErrors.push(err46);
                }
                errors++;
              }
            }
            if (data5.cost !== void 0) {
              if (1 !== data5.cost) {
                const err47 = { instancePath: instancePath + "/actions/" + i0 + "/cost", schemaPath: "#/$defs/interviewAction/properties/cost/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                if (vErrors === null) {
                  vErrors = [err47];
                } else {
                  vErrors.push(err47);
                }
                errors++;
              }
            }
            if (data5.label !== void 0) {
              let data16 = data5.label;
              if (typeof data16 === "string") {
                if (func2(data16) < 1) {
                  const err48 = { instancePath: instancePath + "/actions/" + i0 + "/label", schemaPath: "#/$defs/interviewAction/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err48];
                  } else {
                    vErrors.push(err48);
                  }
                  errors++;
                }
              } else {
                const err49 = { instancePath: instancePath + "/actions/" + i0 + "/label", schemaPath: "#/$defs/interviewAction/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err49];
                } else {
                  vErrors.push(err49);
                }
                errors++;
              }
            }
            if (data5.resultText !== void 0) {
              let data17 = data5.resultText;
              if (typeof data17 === "string") {
                if (func2(data17) < 1) {
                  const err50 = { instancePath: instancePath + "/actions/" + i0 + "/resultText", schemaPath: "#/$defs/interviewAction/properties/resultText/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err50];
                  } else {
                    vErrors.push(err50);
                  }
                  errors++;
                }
              } else {
                const err51 = { instancePath: instancePath + "/actions/" + i0 + "/resultText", schemaPath: "#/$defs/interviewAction/properties/resultText/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err51];
                } else {
                  vErrors.push(err51);
                }
                errors++;
              }
            }
            if (data5.guestFacetKey !== void 0) {
              let data18 = data5.guestFacetKey;
              if (typeof data18 === "string") {
                if (!pattern9.test(data18)) {
                  const err52 = { instancePath: instancePath + "/actions/" + i0 + "/guestFacetKey", schemaPath: "#/$defs/interviewAction/properties/guestFacetKey/pattern", keyword: "pattern", params: { pattern: "^[^:]+:[^:]+$" }, message: 'must match pattern "^[^:]+:[^:]+$"' };
                  if (vErrors === null) {
                    vErrors = [err52];
                  } else {
                    vErrors.push(err52);
                  }
                  errors++;
                }
              } else {
                const err53 = { instancePath: instancePath + "/actions/" + i0 + "/guestFacetKey", schemaPath: "#/$defs/interviewAction/properties/guestFacetKey/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err53];
                } else {
                  vErrors.push(err53);
                }
                errors++;
              }
            }
          } else {
            const err54 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/interviewAction/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err54];
            } else {
              vErrors.push(err54);
            }
            errors++;
          }
          var _valid0 = _errs28 === errors;
          if (_valid0 && valid3) {
            valid3 = false;
            passing0 = [passing0, 1];
          } else {
            if (_valid0) {
              valid3 = true;
              passing0 = 1;
              if (props0 !== true) {
                props0 = true;
              }
            }
            const _errs42 = errors;
            if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
              if (data5.id === void 0) {
                const err55 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
                if (vErrors === null) {
                  vErrors = [err55];
                } else {
                  vErrors.push(err55);
                }
                errors++;
              }
              if (data5.kind === void 0) {
                const err56 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
                if (vErrors === null) {
                  vErrors = [err56];
                } else {
                  vErrors.push(err56);
                }
                errors++;
              }
              if (data5.cost === void 0) {
                const err57 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "cost" }, message: "must have required property 'cost'" };
                if (vErrors === null) {
                  vErrors = [err57];
                } else {
                  vErrors.push(err57);
                }
                errors++;
              }
              if (data5.label === void 0) {
                const err58 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "label" }, message: "must have required property 'label'" };
                if (vErrors === null) {
                  vErrors = [err58];
                } else {
                  vErrors.push(err58);
                }
                errors++;
              }
              if (data5.resultText === void 0) {
                const err59 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "resultText" }, message: "must have required property 'resultText'" };
                if (vErrors === null) {
                  vErrors = [err59];
                } else {
                  vErrors.push(err59);
                }
                errors++;
              }
              if (data5.stat === void 0) {
                const err60 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "stat" }, message: "must have required property 'stat'" };
                if (vErrors === null) {
                  vErrors = [err60];
                } else {
                  vErrors.push(err60);
                }
                errors++;
              }
              if (data5.delta === void 0) {
                const err61 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/required", keyword: "required", params: { missingProperty: "delta" }, message: "must have required property 'delta'" };
                if (vErrors === null) {
                  vErrors = [err61];
                } else {
                  vErrors.push(err61);
                }
                errors++;
              }
              for (const key3 in data5) {
                if (!(key3 === "id" || key3 === "kind" || key3 === "cost" || key3 === "label" || key3 === "resultText" || key3 === "stat" || key3 === "delta")) {
                  const err62 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" };
                  if (vErrors === null) {
                    vErrors = [err62];
                  } else {
                    vErrors.push(err62);
                  }
                  errors++;
                }
              }
              if (data5.id !== void 0) {
                let data19 = data5.id;
                if (typeof data19 === "string") {
                  if (func2(data19) < 1) {
                    const err63 = { instancePath: instancePath + "/actions/" + i0 + "/id", schemaPath: "#/$defs/stabilizeAction/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                    if (vErrors === null) {
                      vErrors = [err63];
                    } else {
                      vErrors.push(err63);
                    }
                    errors++;
                  }
                } else {
                  const err64 = { instancePath: instancePath + "/actions/" + i0 + "/id", schemaPath: "#/$defs/stabilizeAction/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err64];
                  } else {
                    vErrors.push(err64);
                  }
                  errors++;
                }
              }
              if (data5.kind !== void 0) {
                if ("stabilize" !== data5.kind) {
                  const err65 = { instancePath: instancePath + "/actions/" + i0 + "/kind", schemaPath: "#/$defs/stabilizeAction/properties/kind/const", keyword: "const", params: { allowedValue: "stabilize" }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err65];
                  } else {
                    vErrors.push(err65);
                  }
                  errors++;
                }
              }
              if (data5.cost !== void 0) {
                if (1 !== data5.cost) {
                  const err66 = { instancePath: instancePath + "/actions/" + i0 + "/cost", schemaPath: "#/$defs/stabilizeAction/properties/cost/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" };
                  if (vErrors === null) {
                    vErrors = [err66];
                  } else {
                    vErrors.push(err66);
                  }
                  errors++;
                }
              }
              if (data5.label !== void 0) {
                let data22 = data5.label;
                if (typeof data22 === "string") {
                  if (func2(data22) < 1) {
                    const err67 = { instancePath: instancePath + "/actions/" + i0 + "/label", schemaPath: "#/$defs/stabilizeAction/properties/label/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                    if (vErrors === null) {
                      vErrors = [err67];
                    } else {
                      vErrors.push(err67);
                    }
                    errors++;
                  }
                } else {
                  const err68 = { instancePath: instancePath + "/actions/" + i0 + "/label", schemaPath: "#/$defs/stabilizeAction/properties/label/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err68];
                  } else {
                    vErrors.push(err68);
                  }
                  errors++;
                }
              }
              if (data5.resultText !== void 0) {
                let data23 = data5.resultText;
                if (typeof data23 === "string") {
                  if (func2(data23) < 1) {
                    const err69 = { instancePath: instancePath + "/actions/" + i0 + "/resultText", schemaPath: "#/$defs/stabilizeAction/properties/resultText/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                    if (vErrors === null) {
                      vErrors = [err69];
                    } else {
                      vErrors.push(err69);
                    }
                    errors++;
                  }
                } else {
                  const err70 = { instancePath: instancePath + "/actions/" + i0 + "/resultText", schemaPath: "#/$defs/stabilizeAction/properties/resultText/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                  if (vErrors === null) {
                    vErrors = [err70];
                  } else {
                    vErrors.push(err70);
                  }
                  errors++;
                }
              }
              if (data5.stat !== void 0) {
                let data24 = data5.stat;
                if (!(data24 === "heat" || data24 === "trust")) {
                  const err71 = { instancePath: instancePath + "/actions/" + i0 + "/stat", schemaPath: "#/$defs/stabilizeAction/properties/stat/enum", keyword: "enum", params: { allowedValues: schema70.properties.stat.enum }, message: "must be equal to one of the allowed values" };
                  if (vErrors === null) {
                    vErrors = [err71];
                  } else {
                    vErrors.push(err71);
                  }
                  errors++;
                }
              }
              if (data5.delta !== void 0) {
                let data25 = data5.delta;
                if (!(typeof data25 == "number" && isFinite(data25))) {
                  const err72 = { instancePath: instancePath + "/actions/" + i0 + "/delta", schemaPath: "#/$defs/stabilizeAction/properties/delta/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                  if (vErrors === null) {
                    vErrors = [err72];
                  } else {
                    vErrors.push(err72);
                  }
                  errors++;
                }
                const _errs57 = errors;
                const _errs58 = errors;
                if (0 !== data25) {
                  const err73 = {};
                  if (vErrors === null) {
                    vErrors = [err73];
                  } else {
                    vErrors.push(err73);
                  }
                  errors++;
                }
                var valid10 = _errs58 === errors;
                if (valid10) {
                  const err74 = { instancePath: instancePath + "/actions/" + i0 + "/delta", schemaPath: "#/$defs/stabilizeAction/properties/delta/not", keyword: "not", params: {}, message: "must NOT be valid" };
                  if (vErrors === null) {
                    vErrors = [err74];
                  } else {
                    vErrors.push(err74);
                  }
                  errors++;
                } else {
                  errors = _errs57;
                  if (vErrors !== null) {
                    if (_errs57) {
                      vErrors.length = _errs57;
                    } else {
                      vErrors = null;
                    }
                  }
                }
              }
            } else {
              const err75 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/$defs/stabilizeAction/type", keyword: "type", params: { type: "object" }, message: "must be object" };
              if (vErrors === null) {
                vErrors = [err75];
              } else {
                vErrors.push(err75);
              }
              errors++;
            }
            var _valid0 = _errs42 === errors;
            if (_valid0 && valid3) {
              valid3 = false;
              passing0 = [passing0, 2];
            } else {
              if (_valid0) {
                valid3 = true;
                passing0 = 2;
                if (props0 !== true) {
                  props0 = true;
                }
              }
            }
          }
          if (!valid3) {
            const err76 = { instancePath: instancePath + "/actions/" + i0, schemaPath: "#/properties/actions/items/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
            if (vErrors === null) {
              vErrors = [err76];
            } else {
              vErrors.push(err76);
            }
            errors++;
          } else {
            errors = _errs12;
            if (vErrors !== null) {
              if (_errs12) {
                vErrors.length = _errs12;
              } else {
                vErrors = null;
              }
            }
          }
        }
      } else {
        const err77 = { instancePath: instancePath + "/actions", schemaPath: "#/properties/actions/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err77];
        } else {
          vErrors.push(err77);
        }
        errors++;
      }
    }
    if (data.presentation !== void 0) {
      let data26 = data.presentation;
      if (typeof data26 === "string") {
        if (func2(data26) < 1) {
          const err78 = { instancePath: instancePath + "/presentation", schemaPath: "#/properties/presentation/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err78];
          } else {
            vErrors.push(err78);
          }
          errors++;
        }
      } else {
        const err79 = { instancePath: instancePath + "/presentation", schemaPath: "#/properties/presentation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err79];
        } else {
          vErrors.push(err79);
        }
        errors++;
      }
    }
    if (data.provenance !== void 0) {
      let data27 = data.provenance;
      if (data27 && typeof data27 == "object" && !Array.isArray(data27)) {
        if (data27.sourceSnapshotIds === void 0) {
          const err80 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "sourceSnapshotIds" }, message: "must have required property 'sourceSnapshotIds'" };
          if (vErrors === null) {
            vErrors = [err80];
          } else {
            vErrors.push(err80);
          }
          errors++;
        }
        if (data27.inputSha256 === void 0) {
          const err81 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "inputSha256" }, message: "must have required property 'inputSha256'" };
          if (vErrors === null) {
            vErrors = [err81];
          } else {
            vErrors.push(err81);
          }
          errors++;
        }
        if (data27.validatorVersion === void 0) {
          const err82 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "validatorVersion" }, message: "must have required property 'validatorVersion'" };
          if (vErrors === null) {
            vErrors = [err82];
          } else {
            vErrors.push(err82);
          }
          errors++;
        }
        if (data27.outputSha256 === void 0) {
          const err83 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "outputSha256" }, message: "must have required property 'outputSha256'" };
          if (vErrors === null) {
            vErrors = [err83];
          } else {
            vErrors.push(err83);
          }
          errors++;
        }
        for (const key4 in data27) {
          if (!(key4 === "sourceSnapshotIds" || key4 === "inputSha256" || key4 === "modelId" || key4 === "promptVersion" || key4 === "seed" || key4 === "rawResponseSha256" || key4 === "validatorVersion" || key4 === "outputSha256")) {
            const err84 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err84];
            } else {
              vErrors.push(err84);
            }
            errors++;
          }
        }
        if (data27.sourceSnapshotIds !== void 0) {
          let data28 = data27.sourceSnapshotIds;
          if (Array.isArray(data28)) {
            const len1 = data28.length;
            for (let i1 = 0; i1 < len1; i1++) {
              let data29 = data28[i1];
              if (typeof data29 === "string") {
                if (func2(data29) < 1) {
                  const err85 = { instancePath: instancePath + "/provenance/sourceSnapshotIds/" + i1, schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err85];
                  } else {
                    vErrors.push(err85);
                  }
                  errors++;
                }
              } else {
                const err86 = { instancePath: instancePath + "/provenance/sourceSnapshotIds/" + i1, schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err86];
                } else {
                  vErrors.push(err86);
                }
                errors++;
              }
            }
            let i2 = data28.length;
            let j0;
            if (i2 > 1) {
              const indices0 = {};
              for (; i2--; ) {
                let item0 = data28[i2];
                if (typeof item0 !== "string") {
                  continue;
                }
                if (typeof indices0[item0] == "number") {
                  j0 = indices0[item0];
                  const err87 = { instancePath: instancePath + "/provenance/sourceSnapshotIds", schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/uniqueItems", keyword: "uniqueItems", params: { i: i2, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i2 + " are identical)" };
                  if (vErrors === null) {
                    vErrors = [err87];
                  } else {
                    vErrors.push(err87);
                  }
                  errors++;
                  break;
                }
                indices0[item0] = i2;
              }
            }
          } else {
            const err88 = { instancePath: instancePath + "/provenance/sourceSnapshotIds", schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err88];
            } else {
              vErrors.push(err88);
            }
            errors++;
          }
        }
        if (data27.inputSha256 !== void 0) {
          let data30 = data27.inputSha256;
          if (typeof data30 === "string") {
            if (!pattern5.test(data30)) {
              const err89 = { instancePath: instancePath + "/provenance/inputSha256", schemaPath: "#/$defs/packProvenance/properties/inputSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err89];
              } else {
                vErrors.push(err89);
              }
              errors++;
            }
          } else {
            const err90 = { instancePath: instancePath + "/provenance/inputSha256", schemaPath: "#/$defs/packProvenance/properties/inputSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err90];
            } else {
              vErrors.push(err90);
            }
            errors++;
          }
        }
        if (data27.modelId !== void 0) {
          if (typeof data27.modelId !== "string") {
            const err91 = { instancePath: instancePath + "/provenance/modelId", schemaPath: "#/$defs/packProvenance/properties/modelId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err91];
            } else {
              vErrors.push(err91);
            }
            errors++;
          }
        }
        if (data27.promptVersion !== void 0) {
          if (typeof data27.promptVersion !== "string") {
            const err92 = { instancePath: instancePath + "/provenance/promptVersion", schemaPath: "#/$defs/packProvenance/properties/promptVersion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err92];
            } else {
              vErrors.push(err92);
            }
            errors++;
          }
        }
        if (data27.seed !== void 0) {
          let data33 = data27.seed;
          if (!(typeof data33 == "number" && (!(data33 % 1) && !isNaN(data33)) && isFinite(data33))) {
            const err93 = { instancePath: instancePath + "/provenance/seed", schemaPath: "#/$defs/packProvenance/properties/seed/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err93];
            } else {
              vErrors.push(err93);
            }
            errors++;
          }
        }
        if (data27.rawResponseSha256 !== void 0) {
          let data34 = data27.rawResponseSha256;
          if (typeof data34 === "string") {
            if (!pattern5.test(data34)) {
              const err94 = { instancePath: instancePath + "/provenance/rawResponseSha256", schemaPath: "#/$defs/packProvenance/properties/rawResponseSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err94];
              } else {
                vErrors.push(err94);
              }
              errors++;
            }
          } else {
            const err95 = { instancePath: instancePath + "/provenance/rawResponseSha256", schemaPath: "#/$defs/packProvenance/properties/rawResponseSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err95];
            } else {
              vErrors.push(err95);
            }
            errors++;
          }
        }
        if (data27.validatorVersion !== void 0) {
          let data35 = data27.validatorVersion;
          if (typeof data35 === "string") {
            if (func2(data35) < 1) {
              const err96 = { instancePath: instancePath + "/provenance/validatorVersion", schemaPath: "#/$defs/packProvenance/properties/validatorVersion/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err96];
              } else {
                vErrors.push(err96);
              }
              errors++;
            }
          } else {
            const err97 = { instancePath: instancePath + "/provenance/validatorVersion", schemaPath: "#/$defs/packProvenance/properties/validatorVersion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err97];
            } else {
              vErrors.push(err97);
            }
            errors++;
          }
        }
        if (data27.outputSha256 !== void 0) {
          let data36 = data27.outputSha256;
          if (typeof data36 === "string") {
            if (!pattern5.test(data36)) {
              const err98 = { instancePath: instancePath + "/provenance/outputSha256", schemaPath: "#/$defs/packProvenance/properties/outputSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err98];
              } else {
                vErrors.push(err98);
              }
              errors++;
            }
          } else {
            const err99 = { instancePath: instancePath + "/provenance/outputSha256", schemaPath: "#/$defs/packProvenance/properties/outputSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err99];
            } else {
              vErrors.push(err99);
            }
            errors++;
          }
        }
      } else {
        const err100 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err100];
        } else {
          vErrors.push(err100);
        }
        errors++;
      }
    }
  } else {
    const err101 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err101];
    } else {
      vErrors.push(err101);
    }
    errors++;
  }
  validate45.errors = vErrors;
  return errors === 0;
}
validate45.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
var schema72 = { "type": "object", "required": ["id", "triggerRuleId", "warningRuleId", "presentation", "provenance"], "additionalProperties": false, "properties": { "id": { "type": "string", "minLength": 1 }, "triggerRuleId": { "enum": ["bad-press", "bad-collapse"] }, "warningRuleId": { "enum": ["press", "collapse"] }, "presentation": { "type": "string", "minLength": 1 }, "provenance": { "$ref": "#/$defs/packProvenance" } } };
function validate47(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate47.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.id === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.triggerRuleId === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "triggerRuleId" }, message: "must have required property 'triggerRuleId'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.warningRuleId === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "warningRuleId" }, message: "must have required property 'warningRuleId'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.presentation === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "presentation" }, message: "must have required property 'presentation'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.provenance === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "provenance" }, message: "must have required property 'provenance'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "id" || key0 === "triggerRuleId" || key0 === "warningRuleId" || key0 === "presentation" || key0 === "provenance")) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data0 = data.id;
      if (typeof data0 === "string") {
        if (func2(data0) < 1) {
          const err6 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
      } else {
        const err7 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.triggerRuleId !== void 0) {
      let data1 = data.triggerRuleId;
      if (!(data1 === "bad-press" || data1 === "bad-collapse")) {
        const err8 = { instancePath: instancePath + "/triggerRuleId", schemaPath: "#/properties/triggerRuleId/enum", keyword: "enum", params: { allowedValues: schema72.properties.triggerRuleId.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
    if (data.warningRuleId !== void 0) {
      let data2 = data.warningRuleId;
      if (!(data2 === "press" || data2 === "collapse")) {
        const err9 = { instancePath: instancePath + "/warningRuleId", schemaPath: "#/properties/warningRuleId/enum", keyword: "enum", params: { allowedValues: schema72.properties.warningRuleId.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.presentation !== void 0) {
      let data3 = data.presentation;
      if (typeof data3 === "string") {
        if (func2(data3) < 1) {
          const err10 = { instancePath: instancePath + "/presentation", schemaPath: "#/properties/presentation/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
      } else {
        const err11 = { instancePath: instancePath + "/presentation", schemaPath: "#/properties/presentation/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.provenance !== void 0) {
      let data4 = data.provenance;
      if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
        if (data4.sourceSnapshotIds === void 0) {
          const err12 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "sourceSnapshotIds" }, message: "must have required property 'sourceSnapshotIds'" };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data4.inputSha256 === void 0) {
          const err13 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "inputSha256" }, message: "must have required property 'inputSha256'" };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        if (data4.validatorVersion === void 0) {
          const err14 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "validatorVersion" }, message: "must have required property 'validatorVersion'" };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data4.outputSha256 === void 0) {
          const err15 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "outputSha256" }, message: "must have required property 'outputSha256'" };
          if (vErrors === null) {
            vErrors = [err15];
          } else {
            vErrors.push(err15);
          }
          errors++;
        }
        for (const key1 in data4) {
          if (!(key1 === "sourceSnapshotIds" || key1 === "inputSha256" || key1 === "modelId" || key1 === "promptVersion" || key1 === "seed" || key1 === "rawResponseSha256" || key1 === "validatorVersion" || key1 === "outputSha256")) {
            const err16 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        }
        if (data4.sourceSnapshotIds !== void 0) {
          let data5 = data4.sourceSnapshotIds;
          if (Array.isArray(data5)) {
            const len0 = data5.length;
            for (let i0 = 0; i0 < len0; i0++) {
              let data6 = data5[i0];
              if (typeof data6 === "string") {
                if (func2(data6) < 1) {
                  const err17 = { instancePath: instancePath + "/provenance/sourceSnapshotIds/" + i0, schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
              } else {
                const err18 = { instancePath: instancePath + "/provenance/sourceSnapshotIds/" + i0, schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err18];
                } else {
                  vErrors.push(err18);
                }
                errors++;
              }
            }
            let i1 = data5.length;
            let j0;
            if (i1 > 1) {
              const indices0 = {};
              for (; i1--; ) {
                let item0 = data5[i1];
                if (typeof item0 !== "string") {
                  continue;
                }
                if (typeof indices0[item0] == "number") {
                  j0 = indices0[item0];
                  const err19 = { instancePath: instancePath + "/provenance/sourceSnapshotIds", schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                  break;
                }
                indices0[item0] = i1;
              }
            }
          } else {
            const err20 = { instancePath: instancePath + "/provenance/sourceSnapshotIds", schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          }
        }
        if (data4.inputSha256 !== void 0) {
          let data7 = data4.inputSha256;
          if (typeof data7 === "string") {
            if (!pattern5.test(data7)) {
              const err21 = { instancePath: instancePath + "/provenance/inputSha256", schemaPath: "#/$defs/packProvenance/properties/inputSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err21];
              } else {
                vErrors.push(err21);
              }
              errors++;
            }
          } else {
            const err22 = { instancePath: instancePath + "/provenance/inputSha256", schemaPath: "#/$defs/packProvenance/properties/inputSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
        if (data4.modelId !== void 0) {
          if (typeof data4.modelId !== "string") {
            const err23 = { instancePath: instancePath + "/provenance/modelId", schemaPath: "#/$defs/packProvenance/properties/modelId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
        }
        if (data4.promptVersion !== void 0) {
          if (typeof data4.promptVersion !== "string") {
            const err24 = { instancePath: instancePath + "/provenance/promptVersion", schemaPath: "#/$defs/packProvenance/properties/promptVersion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err24];
            } else {
              vErrors.push(err24);
            }
            errors++;
          }
        }
        if (data4.seed !== void 0) {
          let data10 = data4.seed;
          if (!(typeof data10 == "number" && (!(data10 % 1) && !isNaN(data10)) && isFinite(data10))) {
            const err25 = { instancePath: instancePath + "/provenance/seed", schemaPath: "#/$defs/packProvenance/properties/seed/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        }
        if (data4.rawResponseSha256 !== void 0) {
          let data11 = data4.rawResponseSha256;
          if (typeof data11 === "string") {
            if (!pattern5.test(data11)) {
              const err26 = { instancePath: instancePath + "/provenance/rawResponseSha256", schemaPath: "#/$defs/packProvenance/properties/rawResponseSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
          } else {
            const err27 = { instancePath: instancePath + "/provenance/rawResponseSha256", schemaPath: "#/$defs/packProvenance/properties/rawResponseSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
        if (data4.validatorVersion !== void 0) {
          let data12 = data4.validatorVersion;
          if (typeof data12 === "string") {
            if (func2(data12) < 1) {
              const err28 = { instancePath: instancePath + "/provenance/validatorVersion", schemaPath: "#/$defs/packProvenance/properties/validatorVersion/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err28];
              } else {
                vErrors.push(err28);
              }
              errors++;
            }
          } else {
            const err29 = { instancePath: instancePath + "/provenance/validatorVersion", schemaPath: "#/$defs/packProvenance/properties/validatorVersion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err29];
            } else {
              vErrors.push(err29);
            }
            errors++;
          }
        }
        if (data4.outputSha256 !== void 0) {
          let data13 = data4.outputSha256;
          if (typeof data13 === "string") {
            if (!pattern5.test(data13)) {
              const err30 = { instancePath: instancePath + "/provenance/outputSha256", schemaPath: "#/$defs/packProvenance/properties/outputSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err30];
              } else {
                vErrors.push(err30);
              }
              errors++;
            }
          } else {
            const err31 = { instancePath: instancePath + "/provenance/outputSha256", schemaPath: "#/$defs/packProvenance/properties/outputSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err31];
            } else {
              vErrors.push(err31);
            }
            errors++;
          }
        }
      } else {
        const err32 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err32];
        } else {
          vErrors.push(err32);
        }
        errors++;
      }
    }
  } else {
    const err33 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err33];
    } else {
      vErrors.push(err33);
    }
    errors++;
  }
  validate47.errors = vErrors;
  return errors === 0;
}
validate47.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
function validate20(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
  ;
  let vErrors = null;
  let errors = 0;
  const evaluated0 = validate20.evaluated;
  if (evaluated0.dynamicProps) {
    evaluated0.props = void 0;
  }
  if (evaluated0.dynamicItems) {
    evaluated0.items = void 0;
  }
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.format === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "format" }, message: "must have required property 'format'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.formatVersion === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "formatVersion" }, message: "must have required property 'formatVersion'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.id === void 0) {
      const err2 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
      if (vErrors === null) {
        vErrors = [err2];
      } else {
        vErrors.push(err2);
      }
      errors++;
    }
    if (data.mergeMode === void 0) {
      const err3 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "mergeMode" }, message: "must have required property 'mergeMode'" };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.provenance === void 0) {
      const err4 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "provenance" }, message: "must have required property 'provenance'" };
      if (vErrors === null) {
        vErrors = [err4];
      } else {
        vErrors.push(err4);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!func1.call(schema31.properties, key0)) {
        const err5 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err5];
        } else {
          vErrors.push(err5);
        }
        errors++;
      }
    }
    if (data.format !== void 0) {
      if ("game-data-pack" !== data.format) {
        const err6 = { instancePath: instancePath + "/format", schemaPath: "#/properties/format/const", keyword: "const", params: { allowedValue: "game-data-pack" }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    }
    if (data.formatVersion !== void 0) {
      if (2 !== data.formatVersion) {
        const err7 = { instancePath: instancePath + "/formatVersion", schemaPath: "#/properties/formatVersion/const", keyword: "const", params: { allowedValue: 2 }, message: "must be equal to constant" };
        if (vErrors === null) {
          vErrors = [err7];
        } else {
          vErrors.push(err7);
        }
        errors++;
      }
    }
    if (data.id !== void 0) {
      let data2 = data.id;
      if (typeof data2 === "string") {
        if (!pattern4.test(data2)) {
          const err8 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/pattern", keyword: "pattern", params: { pattern: "^[a-z][a-z0-9_.-]*$" }, message: 'must match pattern "^[a-z][a-z0-9_.-]*$"' };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
      } else {
        const err9 = { instancePath: instancePath + "/id", schemaPath: "#/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    if (data.name !== void 0) {
      if (typeof data.name !== "string") {
        const err10 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err10];
        } else {
          vErrors.push(err10);
        }
        errors++;
      }
    }
    if (data.version !== void 0) {
      if (typeof data.version !== "string") {
        const err11 = { instancePath: instancePath + "/version", schemaPath: "#/properties/version/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    }
    if (data.mergeMode !== void 0) {
      let data5 = data.mergeMode;
      if (!(data5 === "base" || data5 === "alongside" || data5 === "promotion")) {
        const err12 = { instancePath: instancePath + "/mergeMode", schemaPath: "#/properties/mergeMode/enum", keyword: "enum", params: { allowedValues: schema31.properties.mergeMode.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err12];
        } else {
          vErrors.push(err12);
        }
        errors++;
      }
    }
    if (data.promotionTargets !== void 0) {
      let data6 = data.promotionTargets;
      if (Array.isArray(data6)) {
        const len0 = data6.length;
        for (let i0 = 0; i0 < len0; i0++) {
          let data7 = data6[i0];
          if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
            if (data7.kind === void 0) {
              const err13 = { instancePath: instancePath + "/promotionTargets/" + i0, schemaPath: "#/$defs/promotionTarget/required", keyword: "required", params: { missingProperty: "kind" }, message: "must have required property 'kind'" };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            if (data7.id === void 0) {
              const err14 = { instancePath: instancePath + "/promotionTargets/" + i0, schemaPath: "#/$defs/promotionTarget/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            if (data7.expectedSourcePack === void 0) {
              const err15 = { instancePath: instancePath + "/promotionTargets/" + i0, schemaPath: "#/$defs/promotionTarget/required", keyword: "required", params: { missingProperty: "expectedSourcePack" }, message: "must have required property 'expectedSourcePack'" };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            for (const key1 in data7) {
              if (!(key1 === "kind" || key1 === "id" || key1 === "expectedSourcePack")) {
                const err16 = { instancePath: instancePath + "/promotionTargets/" + i0, schemaPath: "#/$defs/promotionTarget/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err16];
                } else {
                  vErrors.push(err16);
                }
                errors++;
              }
            }
            if (data7.kind !== void 0) {
              let data8 = data7.kind;
              if (!(data8 === "clue" || data8 === "pattern" || data8 === "hint" || data8 === "case" || data8 === "run" || data8 === "interlude" || data8 === "ending")) {
                const err17 = { instancePath: instancePath + "/promotionTargets/" + i0 + "/kind", schemaPath: "#/$defs/promotionTarget/properties/kind/enum", keyword: "enum", params: { allowedValues: schema32.properties.kind.enum }, message: "must be equal to one of the allowed values" };
                if (vErrors === null) {
                  vErrors = [err17];
                } else {
                  vErrors.push(err17);
                }
                errors++;
              }
            }
            if (data7.id !== void 0) {
              let data9 = data7.id;
              if (typeof data9 === "string") {
                if (func2(data9) < 1) {
                  const err18 = { instancePath: instancePath + "/promotionTargets/" + i0 + "/id", schemaPath: "#/$defs/promotionTarget/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err18];
                  } else {
                    vErrors.push(err18);
                  }
                  errors++;
                }
              } else {
                const err19 = { instancePath: instancePath + "/promotionTargets/" + i0 + "/id", schemaPath: "#/$defs/promotionTarget/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err19];
                } else {
                  vErrors.push(err19);
                }
                errors++;
              }
            }
            if (data7.expectedSourcePack !== void 0) {
              let data10 = data7.expectedSourcePack;
              if (typeof data10 === "string") {
                if (func2(data10) < 1) {
                  const err20 = { instancePath: instancePath + "/promotionTargets/" + i0 + "/expectedSourcePack", schemaPath: "#/$defs/promotionTarget/properties/expectedSourcePack/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err20];
                  } else {
                    vErrors.push(err20);
                  }
                  errors++;
                }
              } else {
                const err21 = { instancePath: instancePath + "/promotionTargets/" + i0 + "/expectedSourcePack", schemaPath: "#/$defs/promotionTarget/properties/expectedSourcePack/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
            }
          } else {
            const err22 = { instancePath: instancePath + "/promotionTargets/" + i0, schemaPath: "#/$defs/promotionTarget/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
        let i1 = data6.length;
        let j0;
        if (i1 > 1) {
          outer0: for (; i1--; ) {
            for (j0 = i1; j0--; ) {
              if (func0(data6[i1], data6[j0])) {
                const err23 = { instancePath: instancePath + "/promotionTargets", schemaPath: "#/properties/promotionTargets/uniqueItems", keyword: "uniqueItems", params: { i: i1, j: j0 }, message: "must NOT have duplicate items (items ## " + j0 + " and " + i1 + " are identical)" };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
                break outer0;
              }
            }
          }
        }
      } else {
        const err24 = { instancePath: instancePath + "/promotionTargets", schemaPath: "#/properties/promotionTargets/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err24];
        } else {
          vErrors.push(err24);
        }
        errors++;
      }
    }
    if (data.provenance !== void 0) {
      let data11 = data.provenance;
      if (data11 && typeof data11 == "object" && !Array.isArray(data11)) {
        if (data11.sourceSnapshotIds === void 0) {
          const err25 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "sourceSnapshotIds" }, message: "must have required property 'sourceSnapshotIds'" };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        if (data11.inputSha256 === void 0) {
          const err26 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "inputSha256" }, message: "must have required property 'inputSha256'" };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
        if (data11.validatorVersion === void 0) {
          const err27 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "validatorVersion" }, message: "must have required property 'validatorVersion'" };
          if (vErrors === null) {
            vErrors = [err27];
          } else {
            vErrors.push(err27);
          }
          errors++;
        }
        if (data11.outputSha256 === void 0) {
          const err28 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/required", keyword: "required", params: { missingProperty: "outputSha256" }, message: "must have required property 'outputSha256'" };
          if (vErrors === null) {
            vErrors = [err28];
          } else {
            vErrors.push(err28);
          }
          errors++;
        }
        for (const key2 in data11) {
          if (!(key2 === "sourceSnapshotIds" || key2 === "inputSha256" || key2 === "modelId" || key2 === "promptVersion" || key2 === "seed" || key2 === "rawResponseSha256" || key2 === "validatorVersion" || key2 === "outputSha256")) {
            const err29 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" };
            if (vErrors === null) {
              vErrors = [err29];
            } else {
              vErrors.push(err29);
            }
            errors++;
          }
        }
        if (data11.sourceSnapshotIds !== void 0) {
          let data12 = data11.sourceSnapshotIds;
          if (Array.isArray(data12)) {
            const len1 = data12.length;
            for (let i2 = 0; i2 < len1; i2++) {
              let data13 = data12[i2];
              if (typeof data13 === "string") {
                if (func2(data13) < 1) {
                  const err30 = { instancePath: instancePath + "/provenance/sourceSnapshotIds/" + i2, schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/items/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
                  if (vErrors === null) {
                    vErrors = [err30];
                  } else {
                    vErrors.push(err30);
                  }
                  errors++;
                }
              } else {
                const err31 = { instancePath: instancePath + "/provenance/sourceSnapshotIds/" + i2, schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/items/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err31];
                } else {
                  vErrors.push(err31);
                }
                errors++;
              }
            }
            let i3 = data12.length;
            let j1;
            if (i3 > 1) {
              const indices0 = {};
              for (; i3--; ) {
                let item0 = data12[i3];
                if (typeof item0 !== "string") {
                  continue;
                }
                if (typeof indices0[item0] == "number") {
                  j1 = indices0[item0];
                  const err32 = { instancePath: instancePath + "/provenance/sourceSnapshotIds", schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/uniqueItems", keyword: "uniqueItems", params: { i: i3, j: j1 }, message: "must NOT have duplicate items (items ## " + j1 + " and " + i3 + " are identical)" };
                  if (vErrors === null) {
                    vErrors = [err32];
                  } else {
                    vErrors.push(err32);
                  }
                  errors++;
                  break;
                }
                indices0[item0] = i3;
              }
            }
          } else {
            const err33 = { instancePath: instancePath + "/provenance/sourceSnapshotIds", schemaPath: "#/$defs/packProvenance/properties/sourceSnapshotIds/type", keyword: "type", params: { type: "array" }, message: "must be array" };
            if (vErrors === null) {
              vErrors = [err33];
            } else {
              vErrors.push(err33);
            }
            errors++;
          }
        }
        if (data11.inputSha256 !== void 0) {
          let data14 = data11.inputSha256;
          if (typeof data14 === "string") {
            if (!pattern5.test(data14)) {
              const err34 = { instancePath: instancePath + "/provenance/inputSha256", schemaPath: "#/$defs/packProvenance/properties/inputSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err34];
              } else {
                vErrors.push(err34);
              }
              errors++;
            }
          } else {
            const err35 = { instancePath: instancePath + "/provenance/inputSha256", schemaPath: "#/$defs/packProvenance/properties/inputSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err35];
            } else {
              vErrors.push(err35);
            }
            errors++;
          }
        }
        if (data11.modelId !== void 0) {
          if (typeof data11.modelId !== "string") {
            const err36 = { instancePath: instancePath + "/provenance/modelId", schemaPath: "#/$defs/packProvenance/properties/modelId/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err36];
            } else {
              vErrors.push(err36);
            }
            errors++;
          }
        }
        if (data11.promptVersion !== void 0) {
          if (typeof data11.promptVersion !== "string") {
            const err37 = { instancePath: instancePath + "/provenance/promptVersion", schemaPath: "#/$defs/packProvenance/properties/promptVersion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err37];
            } else {
              vErrors.push(err37);
            }
            errors++;
          }
        }
        if (data11.seed !== void 0) {
          let data17 = data11.seed;
          if (!(typeof data17 == "number" && (!(data17 % 1) && !isNaN(data17)) && isFinite(data17))) {
            const err38 = { instancePath: instancePath + "/provenance/seed", schemaPath: "#/$defs/packProvenance/properties/seed/type", keyword: "type", params: { type: "integer" }, message: "must be integer" };
            if (vErrors === null) {
              vErrors = [err38];
            } else {
              vErrors.push(err38);
            }
            errors++;
          }
        }
        if (data11.rawResponseSha256 !== void 0) {
          let data18 = data11.rawResponseSha256;
          if (typeof data18 === "string") {
            if (!pattern5.test(data18)) {
              const err39 = { instancePath: instancePath + "/provenance/rawResponseSha256", schemaPath: "#/$defs/packProvenance/properties/rawResponseSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err39];
              } else {
                vErrors.push(err39);
              }
              errors++;
            }
          } else {
            const err40 = { instancePath: instancePath + "/provenance/rawResponseSha256", schemaPath: "#/$defs/packProvenance/properties/rawResponseSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err40];
            } else {
              vErrors.push(err40);
            }
            errors++;
          }
        }
        if (data11.validatorVersion !== void 0) {
          let data19 = data11.validatorVersion;
          if (typeof data19 === "string") {
            if (func2(data19) < 1) {
              const err41 = { instancePath: instancePath + "/provenance/validatorVersion", schemaPath: "#/$defs/packProvenance/properties/validatorVersion/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
              if (vErrors === null) {
                vErrors = [err41];
              } else {
                vErrors.push(err41);
              }
              errors++;
            }
          } else {
            const err42 = { instancePath: instancePath + "/provenance/validatorVersion", schemaPath: "#/$defs/packProvenance/properties/validatorVersion/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err42];
            } else {
              vErrors.push(err42);
            }
            errors++;
          }
        }
        if (data11.outputSha256 !== void 0) {
          let data20 = data11.outputSha256;
          if (typeof data20 === "string") {
            if (!pattern5.test(data20)) {
              const err43 = { instancePath: instancePath + "/provenance/outputSha256", schemaPath: "#/$defs/packProvenance/properties/outputSha256/pattern", keyword: "pattern", params: { pattern: "^[a-f0-9]{64}$" }, message: 'must match pattern "^[a-f0-9]{64}$"' };
              if (vErrors === null) {
                vErrors = [err43];
              } else {
                vErrors.push(err43);
              }
              errors++;
            }
          } else {
            const err44 = { instancePath: instancePath + "/provenance/outputSha256", schemaPath: "#/$defs/packProvenance/properties/outputSha256/type", keyword: "type", params: { type: "string" }, message: "must be string" };
            if (vErrors === null) {
              vErrors = [err44];
            } else {
              vErrors.push(err44);
            }
            errors++;
          }
        }
      } else {
        const err45 = { instancePath: instancePath + "/provenance", schemaPath: "#/$defs/packProvenance/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err45];
        } else {
          vErrors.push(err45);
        }
        errors++;
      }
    }
    if (data.clues !== void 0) {
      let data21 = data.clues;
      if (data21 && typeof data21 == "object" && !Array.isArray(data21)) {
        for (const key3 in data21) {
          if (!validate36(data21[key3], { instancePath: instancePath + "/clues/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"), parentData: data21, parentDataProperty: key3, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate36.errors : vErrors.concat(validate36.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err46 = { instancePath: instancePath + "/clues", schemaPath: "#/properties/clues/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err46];
        } else {
          vErrors.push(err46);
        }
        errors++;
      }
    }
    if (data.patterns !== void 0) {
      let data23 = data.patterns;
      if (data23 && typeof data23 == "object" && !Array.isArray(data23)) {
        for (const key4 in data23) {
          let data24 = data23[key4];
          if (data24 && typeof data24 == "object" && !Array.isArray(data24)) {
            if (data24.id === void 0) {
              const err47 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/pattern/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err47];
              } else {
                vErrors.push(err47);
              }
              errors++;
            }
            if (data24.name === void 0) {
              const err48 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/pattern/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
              if (vErrors === null) {
                vErrors = [err48];
              } else {
                vErrors.push(err48);
              }
              errors++;
            }
            if (data24.text === void 0) {
              const err49 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/pattern/required", keyword: "required", params: { missingProperty: "text" }, message: "must have required property 'text'" };
              if (vErrors === null) {
                vErrors = [err49];
              } else {
                vErrors.push(err49);
              }
              errors++;
            }
            for (const key5 in data24) {
              if (!(key5 === "id" || key5 === "name" || key5 === "text")) {
                const err50 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/pattern/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key5 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err50];
                } else {
                  vErrors.push(err50);
                }
                errors++;
              }
            }
            if (data24.id !== void 0) {
              if (typeof data24.id !== "string") {
                const err51 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/id", schemaPath: "game-data-pack@1#/$defs/pattern/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err51];
                } else {
                  vErrors.push(err51);
                }
                errors++;
              }
            }
            if (data24.name !== void 0) {
              if (typeof data24.name !== "string") {
                const err52 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/name", schemaPath: "game-data-pack@1#/$defs/pattern/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err52];
                } else {
                  vErrors.push(err52);
                }
                errors++;
              }
            }
            if (data24.text !== void 0) {
              if (typeof data24.text !== "string") {
                const err53 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1") + "/text", schemaPath: "game-data-pack@1#/$defs/pattern/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err53];
                } else {
                  vErrors.push(err53);
                }
                errors++;
              }
            }
          } else {
            const err54 = { instancePath: instancePath + "/patterns/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/pattern/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err54];
            } else {
              vErrors.push(err54);
            }
            errors++;
          }
        }
      } else {
        const err55 = { instancePath: instancePath + "/patterns", schemaPath: "#/properties/patterns/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err55];
        } else {
          vErrors.push(err55);
        }
        errors++;
      }
    }
    if (data.hintDefs !== void 0) {
      let data28 = data.hintDefs;
      if (data28 && typeof data28 == "object" && !Array.isArray(data28)) {
        for (const key6 in data28) {
          let data29 = data28[key6];
          if (data29 && typeof data29 == "object" && !Array.isArray(data29)) {
            if (data29.id === void 0) {
              const err56 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/hintDef/required", keyword: "required", params: { missingProperty: "id" }, message: "must have required property 'id'" };
              if (vErrors === null) {
                vErrors = [err56];
              } else {
                vErrors.push(err56);
              }
              errors++;
            }
            if (data29.name === void 0) {
              const err57 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/hintDef/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
              if (vErrors === null) {
                vErrors = [err57];
              } else {
                vErrors.push(err57);
              }
              errors++;
            }
            if (data29.desc === void 0) {
              const err58 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/hintDef/required", keyword: "required", params: { missingProperty: "desc" }, message: "must have required property 'desc'" };
              if (vErrors === null) {
                vErrors = [err58];
              } else {
                vErrors.push(err58);
              }
              errors++;
            }
            if (data29.heatCost === void 0) {
              const err59 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/hintDef/required", keyword: "required", params: { missingProperty: "heatCost" }, message: "must have required property 'heatCost'" };
              if (vErrors === null) {
                vErrors = [err59];
              } else {
                vErrors.push(err59);
              }
              errors++;
            }
            for (const key7 in data29) {
              if (!(key7 === "id" || key7 === "name" || key7 === "desc" || key7 === "heatCost")) {
                const err60 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/hintDef/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key7 }, message: "must NOT have additional properties" };
                if (vErrors === null) {
                  vErrors = [err60];
                } else {
                  vErrors.push(err60);
                }
                errors++;
              }
            }
            if (data29.id !== void 0) {
              if (typeof data29.id !== "string") {
                const err61 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1") + "/id", schemaPath: "game-data-pack@1#/$defs/hintDef/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err61];
                } else {
                  vErrors.push(err61);
                }
                errors++;
              }
            }
            if (data29.name !== void 0) {
              if (typeof data29.name !== "string") {
                const err62 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1") + "/name", schemaPath: "game-data-pack@1#/$defs/hintDef/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err62];
                } else {
                  vErrors.push(err62);
                }
                errors++;
              }
            }
            if (data29.desc !== void 0) {
              if (typeof data29.desc !== "string") {
                const err63 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1") + "/desc", schemaPath: "game-data-pack@1#/$defs/hintDef/properties/desc/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                if (vErrors === null) {
                  vErrors = [err63];
                } else {
                  vErrors.push(err63);
                }
                errors++;
              }
            }
            if (data29.heatCost !== void 0) {
              let data33 = data29.heatCost;
              if (!(typeof data33 == "number" && isFinite(data33))) {
                const err64 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1") + "/heatCost", schemaPath: "game-data-pack@1#/$defs/hintDef/properties/heatCost/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                if (vErrors === null) {
                  vErrors = [err64];
                } else {
                  vErrors.push(err64);
                }
                errors++;
              }
            }
          } else {
            const err65 = { instancePath: instancePath + "/hintDefs/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "game-data-pack@1#/$defs/hintDef/type", keyword: "type", params: { type: "object" }, message: "must be object" };
            if (vErrors === null) {
              vErrors = [err65];
            } else {
              vErrors.push(err65);
            }
            errors++;
          }
        }
      } else {
        const err66 = { instancePath: instancePath + "/hintDefs", schemaPath: "#/properties/hintDefs/type", keyword: "type", params: { type: "object" }, message: "must be object" };
        if (vErrors === null) {
          vErrors = [err66];
        } else {
          vErrors.push(err66);
        }
        errors++;
      }
    }
    if (data.cases !== void 0) {
      let data34 = data.cases;
      if (Array.isArray(data34)) {
        const len2 = data34.length;
        for (let i4 = 0; i4 < len2; i4++) {
          if (!validate39(data34[i4], { instancePath: instancePath + "/cases/" + i4, parentData: data34, parentDataProperty: i4, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate39.errors : vErrors.concat(validate39.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err67 = { instancePath: instancePath + "/cases", schemaPath: "#/properties/cases/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err67];
        } else {
          vErrors.push(err67);
        }
        errors++;
      }
    }
    if (data.run !== void 0) {
      if (!validate43(data.run, { instancePath: instancePath + "/run", parentData: data, parentDataProperty: "run", rootData, dynamicAnchors })) {
        vErrors = vErrors === null ? validate43.errors : vErrors.concat(validate43.errors);
        errors = vErrors.length;
      }
    }
    if (data.interludes !== void 0) {
      let data37 = data.interludes;
      if (Array.isArray(data37)) {
        const len3 = data37.length;
        for (let i5 = 0; i5 < len3; i5++) {
          if (!validate45(data37[i5], { instancePath: instancePath + "/interludes/" + i5, parentData: data37, parentDataProperty: i5, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate45.errors : vErrors.concat(validate45.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err68 = { instancePath: instancePath + "/interludes", schemaPath: "#/properties/interludes/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err68];
        } else {
          vErrors.push(err68);
        }
        errors++;
      }
    }
    if (data.endings !== void 0) {
      let data39 = data.endings;
      if (Array.isArray(data39)) {
        const len4 = data39.length;
        for (let i6 = 0; i6 < len4; i6++) {
          if (!validate47(data39[i6], { instancePath: instancePath + "/endings/" + i6, parentData: data39, parentDataProperty: i6, rootData, dynamicAnchors })) {
            vErrors = vErrors === null ? validate47.errors : vErrors.concat(validate47.errors);
            errors = vErrors.length;
          }
        }
      } else {
        const err69 = { instancePath: instancePath + "/endings", schemaPath: "#/properties/endings/type", keyword: "type", params: { type: "array" }, message: "must be array" };
        if (vErrors === null) {
          vErrors = [err69];
        } else {
          vErrors.push(err69);
        }
        errors++;
      }
    }
  } else {
    const err70 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err70];
    } else {
      vErrors.push(err70);
    }
    errors++;
  }
  validate20.errors = vErrors;
  return errors === 0;
}
validate20.evaluated = { "props": true, "dynamicProps": false, "dynamicItems": false };
export {
  game_data_pack_v2_validator_raw_default as default,
  validate
};
