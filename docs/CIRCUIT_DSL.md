# Circuit DSL

The DSL converts between readable circuit text and `CircuitDocument`. The converter lives in `src/lib/automation/dsl.ts` and uses the existing block catalog; it does not run the simulation or add an editor UI.

```typescript
import { BLOCK_CATALOG } from '../src/lib/automation/catalog';
import {
  CircuitDSLParseError,
  parseCircuitDSL,
  stringifyCircuitDSL,
} from '../src/lib/automation/dsl';

const code = `circuit "Delayed fan" version 1 {
  I1: INPUT(label="Start", value=false)
  T1: TON(duration=2000)
  Q1: OUTPUT(label="Fan")

  // TON and OUTPUT use input pin A in this catalog.
  I1.Q -> T1.A
  T1.Q -> Q1.A
}`;

try {
  const document = parseCircuitDSL(code, BLOCK_CATALOG);
  const formatted = stringifyCircuitDSL(document);
  console.log(formatted);
} catch (error) {
  if (error instanceof CircuitDSLParseError) {
    console.error(error.message, error.line, error.column);
  } else {
    throw error;
  }
}
```

## Syntax

- Wrap one circuit in `circuit "Name" version 1 { ... }`.
- Declare blocks with `ID: TYPE(key=value, ...)`; use `TYPE()` for no explicit settings.
- Connect named pins with `Source.OutputPin -> Target.InputPin`.
- Syntax, block types, IDs, parameter names, and pins are case sensitive.
- Whitespace and `//` comments outside strings are ignored. No semicolons are needed. Wires can refer to blocks declared later.
- Values are JSON strings, booleans, or finite numbers, including negative numbers, decimals, and exponents. Arrays, objects, and `null` are unsupported. Strings use JSON escaping, for example `label="Fan \"A\""`.
- Values use the catalog's units: `duration=2000` means 2000 milliseconds. Time suffixes such as `2s` are unsupported.

Unquoted identifiers match `[A-Za-z_][A-Za-z0-9_]*`. Use JSON strings for IDs, pin names, and parameter names containing other characters:

```text
circuit "Imported circuit" version 1 {
  "input-1": INPUT(label="Start")
  "output-1": OUTPUT()
  "input-1"."Q" -> "output-1"."A"
}
```

`label`, `tag`, and `value` are reserved settings for the block's top-level metadata. `label` and `tag` are strings; `value` is a signal scalar. To set a catalog parameter with a reserved name, prefix it with `params.`. This prefix also works for ordinary parameters:

```text
circuit "Analog settings" version 1 {
  AI1: ANALOG_INPUT(label="Temperature", tag="AI1", value=21, params.value=20)
  C1: ANALOG_CONSTANT(params.value=50)
  G1: ANALOG_AMPLIFIER(params.gain=1.5, offset=-2)
  AI1.Q -> G1.A
}
```

Here `AI1.value` is 21 and `AI1.params.value` is 20. Quoting a reserved setting name does not change its meaning; use `params.value` to address the parameter. Quoted parameter names also work after the prefix, as in `params."value"=20`.

## Validation

Parsing fills omitted parameters from catalog defaults and validates block types, unique block IDs, unique settings, parameter names and types, numeric bounds, and select options. It validates referenced blocks, pin direction, matching signal kinds, and one wire per target input. An output may drive several inputs. Repeating the same connection is also rejected because the target input is already driven.

Errors throw `CircuitDSLParseError` with a readable message and one-based `line` and `column` properties. For example, referring to `T1.Z` as an output reports the available outputs `Q, ET`.

Successful parsing confirms the DSL and catalog constraints. The existing `LogicEngine` remains responsible for execution readiness, tag rules, and feedback legality. Catalog entries marked `planned` can be parsed; loading those blocks into the engine may still reject them.

## Formatting and round trips

`stringifyCircuitDSL(document)` emits stable text: metadata precedes alphabetically sorted parameter keys, block and connection array order is preserved, and strings and arbitrary identifiers are escaped with JSON rules. Reserved parameter names receive the `params.` prefix.

Parsing assigns every block `position: { x: 0, y: 0 }`. Apply frontend layout before displaying newly parsed circuits. Connections receive `wire_1`, `wire_2`, and so on in wire declaration order.

Round trips preserve circuit names, block IDs and types, metadata, parameter values, and wire endpoints. Omitted parameters are expanded to catalog defaults. Positions, original connection IDs, comments, and original whitespace are not preserved. The DSL contains no layout directives.
