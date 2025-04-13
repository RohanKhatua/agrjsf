# AG Grid Schema Validator

A React component library that integrates AG Grid with JSON Schema validation, providing a powerful and customizable data grid with built-in form validation capabilities.

[![npm version](https://img.shields.io/npm/v/ag-grid-schema-validator.svg)](https://www.npmjs.com/package/ag-grid-schema-validator)
[![License](https://img.shields.io/npm/l/ag-grid-schema-validator.svg)](https://github.com/rohankhatua/ag-grid-schema-validator/blob/main/LICENSE)

## Features

- **AG Grid Integration**: Interactive data grid with sorting, filtering, and pagination
- **JSON Schema Validation**: Validate data using JSON Schema standards
- **Real-time Validation**: Visual feedback for validation errors directly in grid cells
- **Type Safety**: Full TypeScript support with included type definitions
- **Custom Cell Editors**: Specialized editors for different data types based on schema
- **Smart Column Generation**: Automatically creates appropriate columns based on JSON Schema
- **Flexibility**: Extensive customization options for columns, validation, and styling

## Installation

```bash
npm install ag-grid-schema-validator
# or
yarn add ag-grid-schema-validator
# or
bun add ag-grid-schema-validator
```

Also install the peer dependencies if you haven't already:

```bash
npm install react react-dom ag-grid-community ag-grid-react
```

## Basic Usage

```tsx
import React from "react";
import { SchemaGrid } from "ag-grid-schema-validator";
// Import required AG Grid styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

function MyDataGrid() {
  // Define your JSON Schema
  const jsonSchema = {
    type: "object",
    properties: {
      id: {
        type: "string",
        pattern: "^[A-Z]{2}[0-9]{4}$",
        title: "ID",
      },
      name: {
        type: "string",
        minLength: 3,
        title: "Name",
      },
      email: {
        type: "string",
        format: "email",
        title: "Email",
      },
      age: {
        type: "integer",
        minimum: 18,
        title: "Age",
      },
    },
    required: ["id", "email"],
  };

  // Your data
  const rowData = [
    { id: "AB1234", name: "John Doe", email: "john@example.com", age: 32 },
    { id: "CD5678", name: "Jane Smith", email: "jane@example.com", age: 28 },
  ];

  return (
    <SchemaGrid
      jsonSchema={jsonSchema}
      rowData={rowData}
      theme="ag-theme-alpine"
      height="400px"
    />
  );
}

export default MyDataGrid;
```

## API Reference

### SchemaGrid Props

| Prop               | Type                                      | Description                                  | Default           |
| ------------------ | ----------------------------------------- | -------------------------------------------- | ----------------- |
| jsonSchema         | `Record<string, any>`                     | JSON Schema object to validate against       | Required          |
| rowData            | `T[]`                                     | Array of data objects to display in the grid | Required          |
| columnDefs         | `ColDef[]`                                | Custom column definitions (optional)         | Auto-generated    |
| idField            | `keyof T`                                 | Field to use as row identifier               | "id"              |
| onValidationError  | `(errors: ValidationErrorsMap) => void`   | Callback when validation errors occur        | undefined         |
| onCellValueChanged | `(params: CellValueChangedEvent) => void` | Callback when cell values change             | undefined         |
| pagination         | `boolean`                                 | Enable pagination                            | true              |
| paginationPageSize | `number`                                  | Number of rows per page                      | 10                |
| theme              | `string`                                  | AG Grid theme class                          | "ag-theme-alpine" |
| height             | `string \| number`                        | Height of the grid                           | "400px"           |

### Automatic Column Type Detection

The library automatically configures columns based on the JSON Schema:

- **String with enum**: Creates a dropdown selection
- **String with format: "date"**: Creates a date picker
- **Number/Integer**: Creates a numeric editor with optional formatting
- **Boolean**: Creates a checkbox editor
- **Required fields**: Marked with an asterisk (\*)

## Advanced Usage

### Custom Column Definitions

```tsx
import { SchemaGrid } from "ag-grid-schema-validator";
import { ColDef } from "ag-grid-community";

function CustomColumnsGrid() {
  // Your schema and data...

  // Custom column definitions
  const columnDefs: ColDef[] = [
    {
      field: "id",
      headerName: "Employee ID",
      width: 120,
    },
    {
      field: "name",
      headerName: "Full Name",
      flex: 1,
    },
    // ... more columns
  ];

  return (
    <SchemaGrid
      jsonSchema={jsonSchema}
      rowData={rowData}
      columnDefs={columnDefs}
    />
  );
}
```

### Handling Validation Errors

```tsx
function ValidationHandlingGrid() {
  const handleValidationError = (errors) => {
    // Do something with validation errors
    console.log("Validation errors:", errors);

    // Example: Count total errors
    const totalErrors = Object.values(errors).reduce(
      (count, fieldErrors) => count + fieldErrors.length,
      0,
    );

    if (totalErrors > 0) {
      console.warn(`Found ${totalErrors} validation errors`);
    }
  };

  return (
    <SchemaGrid
      jsonSchema={jsonSchema}
      rowData={rowData}
      onValidationError={handleValidationError}
    />
  );
}
```

## License

MIT License - See the LICENSE file for details.
