import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent, ValueFormatterParams, ModuleRegistry, AllCommunityModule, themeMaterial, CellClassParams, CellStyle, ITooltipParams } from 'ag-grid-community';
import Ajv, { ValidateFunction } from 'ajv';
import AjvFormats from 'ajv-formats';

// Define the interface for our data model
interface EmployeeData {
  id: string;
  name: string;
  email: string;
  age: number;
  salary: number;
  department: 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Finance';
  startDate: string;
}

// Type for our validation errors map
interface ValidationErrorsMap {
  [rowId: string]: ValidationError[];
}

// Custom validation error type
interface ValidationError {
  field: string;
  message: string;
}

export default function DataGrid() {

  ModuleRegistry.registerModules([AllCommunityModule]);

  // Define a schema that will be used for both RJSF and our custom validation
  const jsonSchema = useMemo(() => ({
    type: "object",
    properties: {
      id: {
        type: "string",
        pattern: "^[A-Z]{2}[0-9]{4}$",
        title: "ID",
        description: "ID must be 2 uppercase letters followed by 4 digits"
      },
      name: {
        type: "string",
        minLength: 3,
        maxLength: 50,
        title: "Name"
      },
      email: {
        type: "string",
        format: "email",
        title: "Email"
      },
      age: {
        type: "integer",
        minimum: 18,
        maximum: 100,
        title: "Age"
      },
      salary: {
        type: "number",
        minimum: 0.01,

        title: "Salary"
      },
      department: {
        type: "string",
        enum: ["Engineering", "Marketing", "Sales", "HR", "Finance"],
        title: "Department"
      },
      startDate: {
        type: "string",
        format: "date",
        title: "Start Date"
      }
    },
    required: ["id", "name", "email", "age", "department"]
  }), []);

  // Initialize Ajv
  const ajv = useMemo(() => {
    const instance = new Ajv({ allErrors: true });
    AjvFormats(instance); // Add support for formats like "email" and "date"
    return instance;
  }, []);

  // Compile the JSON Schema
  const validateSchema: ValidateFunction = useMemo(() => ajv.compile(jsonSchema), [ajv, jsonSchema]);

  // Sample data
  const initialRowData: EmployeeData[] = [
    { id: "AB1234", name: "John Doe", email: "john@example.com", age: 32, salary: 75000, department: "Engineering", startDate: "2023-01-15" },
    { id: "CD5678", name: "Jane Smith", email: "jane@example.com", age: 28, salary: 82000, department: "Marketing", startDate: "2022-05-20" },
    { id: "EF9012", name: "Bob Johnson", email: "bob@example.com", age: 45, salary: 95000, department: "Sales", startDate: "2021-11-10" }
  ];

  const [rowData] = useState<EmployeeData[]>(initialRowData);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorsMap>({});
  const gridRef = useRef<AgGridReact>(null);

  // Validate a single row - custom validation following the schema rules
  const validateRow = useCallback((data: EmployeeData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate the data against the schema
    const isValid = validateSchema(data);

    if (!isValid && validateSchema.errors) {
      // Map Ajv errors to our ValidationError format
      validateSchema.errors.forEach((error) => {
        if (error.instancePath && error.message) {
          const field = error.instancePath.replace('/', ''); // Remove leading slash
          errors.push({ field, message: error.message });
        }
      });
    }

    return errors;
  }, [validateSchema]);

  // Define column definitions
  const columnDefs: ColDef[] = [
    {
      field: 'id',
      editable: true,
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'id') as CellStyle
    },
    {
      field: 'name',
      editable: true,
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'name') as CellStyle
    },
    {
      field: 'email',
      editable: true,
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'email') as CellStyle
    },
    {
      field: 'age',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'age') as CellStyle
    },
    {
      field: 'salary',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      valueFormatter: (params: ValueFormatterParams) => params.value ? `$${params.value.toLocaleString()}` : '',
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'salary') as CellStyle
    },
    {
      field: 'department',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: jsonSchema.properties.department.enum
      },
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'department') as CellStyle
    },
    {
      field: 'startDate',
      editable: true,
      cellEditor: 'agDateStringCellEditor',
      cellStyle: (params: CellClassParams) => getCellStyle(params.data as EmployeeData, 'startDate') as CellStyle,
    }
  ];

  // Get cell style based on validation errors
  const getCellStyle = (rowData: EmployeeData | undefined, field: string): React.CSSProperties | null => {
    if (!rowData || !validationErrors[rowData.id]) return null;

    const fieldErrors = validationErrors[rowData.id].filter(err => err.field === field);

    return fieldErrors.length > 0 ? { backgroundColor: '#ffdddd' } : { backgroundColor: 'transparent' };
  };

  // Handle cell value changes
  const onCellValueChanged = (params: CellValueChangedEvent): void => {
    const data = params.data as EmployeeData;
    const errors = validateRow(data);

    setValidationErrors(prev => ({
      ...prev,
      [data.id]: errors
    }));
  };

  // Validate all rows on initial load
  useEffect(() => {
    const errors: ValidationErrorsMap = {};
    rowData.forEach(row => {
      errors[row.id] = validateRow(row);
    });
    setValidationErrors(errors);
  }, [rowData, validateRow]);

  // Get error tooltip content
  const getTooltipContent = (params: ITooltipParams): string | null => {
    const data = params.data as EmployeeData;
    const field = params.colDef ? ('field' in params.colDef ? params.colDef.field : undefined) : undefined;

    if (!data || !field || !validationErrors[data.id]) return null;

    const fieldErrors = validationErrors[data.id].filter(err => err.field === field);

    if (fieldErrors.length === 0) return null;

    return fieldErrors.map(err => err.message).join(', ');
  };

  return (
    <div className="flex flex-col h-full w-full">
      <h2 className="text-xl font-bold mb-4">Employee Data Grid with Schema Validation</h2>
      {/* Display validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4">
          <ul className="list-disc pl-5">
            {Object.entries(validationErrors).map(([rowId, errors]) =>
              errors.map((error, index) => (
                <li key={`${rowId}-${index}`} className="text-sm text-red-600">
                  Row ID: <strong>{rowId}</strong>, Field: <strong>{error.field}</strong>, Error: {error.message}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <div className="ag-theme-alpine w-full h-96">
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            tooltipValueGetter: getTooltipContent
          }}
          onCellValueChanged={onCellValueChanged}
          stopEditingWhenCellsLoseFocus={true}
          gridOptions={{
            theme: themeMaterial
          }}
        />
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          * Cells with validation errors are highlighted in red. Hover over them to see the error message.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          * The validation rules match those defined in the JSON Schema.
        </p>
      </div>
    </div>
  );
}