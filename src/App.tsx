import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent, ValueFormatterParams, ICellRendererParams, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

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
  const jsonSchema = {
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
        minimum: 0,
        exclusiveMinimum: true,
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
  };

  // Sample data
  const initialRowData: EmployeeData[] = [
    { id: "AB1234", name: "John Doe", email: "john@example.com", age: 32, salary: 75000, department: "Engineering", startDate: "2023-01-15" },
    { id: "CD5678", name: "Jane Smith", email: "jane@example.com", age: 28, salary: 82000, department: "Marketing", startDate: "2022-05-20" },
    { id: "EF9012", name: "Bob Johnson", email: "bob@example.com", age: 45, salary: 95000, department: "Sales", startDate: "2021-11-10" }
  ];

  const [rowData, setRowData] = useState<EmployeeData[]>(initialRowData);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorsMap>({});
  const gridRef = useRef<AgGridReact>(null);

  // Validate a single row - custom validation following the schema rules
  const validateRow = (data: EmployeeData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // ID validation - pattern: 2 uppercase letters followed by 4 digits
    if (!data.id) {
      errors.push({ field: 'id', message: 'ID is required' });
    } else if (!/^[A-Z]{2}[0-9]{4}$/.test(data.id)) {
      errors.push({ field: 'id', message: 'ID must be 2 uppercase letters followed by 4 digits' });
    }

    // Name validation
    if (!data.name) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (data.name.length < 3) {
      errors.push({ field: 'name', message: 'Name must be at least 3 characters' });
    } else if (data.name.length > 50) {
      errors.push({ field: 'name', message: 'Name must be at most 50 characters' });
    }

    // Email validation
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ field: 'email', message: 'Email must be valid' });
    }

    // Age validation
    if (data.age === undefined || data.age === null) {
      errors.push({ field: 'age', message: 'Age is required' });
    } else if (!Number.isInteger(data.age)) {
      errors.push({ field: 'age', message: 'Age must be an integer' });
    } else if (data.age < 18) {
      errors.push({ field: 'age', message: 'Age must be at least 18' });
    } else if (data.age > 100) {
      errors.push({ field: 'age', message: 'Age must be at most 100' });
    }

    // Salary validation
    if (data.salary !== undefined && data.salary !== null) {
      if (data.salary <= 0) {
        errors.push({ field: 'salary', message: 'Salary must be greater than 0' });
      }
    }

    // Department validation
    if (!data.department) {
      errors.push({ field: 'department', message: 'Department is required' });
    } else if (!["Engineering", "Marketing", "Sales", "HR", "Finance"].includes(data.department)) {
      errors.push({ field: 'department', message: 'Department must be one of the allowed values' });
    }

    // Start date validation
    if (data.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate)) {
      errors.push({ field: 'startDate', message: 'Start date must be in YYYY-MM-DD format' });
    }

    return errors;
  };

  // Define column definitions
  const columnDefs: ColDef[] = [
    {
      field: 'id',
      editable: true,
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'id')
    },
    {
      field: 'name',
      editable: true,
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'name')
    },
    {
      field: 'email',
      editable: true,
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'email')
    },
    {
      field: 'age',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'age')
    },
    {
      field: 'salary',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      valueFormatter: (params: ValueFormatterParams) => params.value ? `$${params.value.toLocaleString()}` : '',
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'salary')
    },
    {
      field: 'department',
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: jsonSchema.properties.department.enum
      },
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'department')
    },
    {
      field: 'startDate',
      editable: true,
      cellEditor: 'agDateStringCellEditor',
      cellStyle: (params: ICellRendererParams) => getCellStyle(params.data as EmployeeData, 'startDate')
    }
  ];

  // Get cell style based on validation errors
  const getCellStyle = (rowData: EmployeeData | undefined, field: string): React.CSSProperties | null => {
    if (!rowData || !validationErrors[rowData.id]) return null;

    const fieldErrors = validationErrors[rowData.id].filter(err => err.field === field);

    return fieldErrors.length > 0 ? { backgroundColor: '#ffdddd' } : null;
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
  }, []);

  // Get error tooltip content
  const getTooltipContent = (params: ICellRendererParams): string | null => {
    const data = params.data as EmployeeData;
    const field = params.colDef?.field;

    if (!data || !field || !validationErrors[data.id]) return null;

    const fieldErrors = validationErrors[data.id].filter(err => err.field === field);

    if (fieldErrors.length === 0) return null;

    return fieldErrors.map(err => err.message).join(', ');
  };

  return (
    <div className="flex flex-col h-full w-full">
      <h2 className="text-xl font-bold mb-4">Employee Data Grid with Schema Validation</h2>
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