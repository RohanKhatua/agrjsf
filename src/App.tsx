import { useState } from "react";
import { SchemaGrid } from "./components/SchemaGrid";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// This is an example of how users will use your published component
export default function App() {
  // Sample JSON Schema
  const jsonSchema = {
    type: "object",
    properties: {
      id: {
        type: "string",
        pattern: "^[A-Z]{2}[0-9]{4}$",
        title: "ID",
        description: "ID must be 2 uppercase letters followed by 4 digits",
      },
      name: {
        type: "string",
        minLength: 3,
        maxLength: 50,
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
        maximum: 100,
        title: "Age",
      },
      salary: {
        type: "number",
        minimum: 0.01,
        title: "Salary",
      },
      department: {
        type: "string",
        enum: ["Engineering", "Marketing", "Sales", "HR", "Finance"],
        title: "Department",
      },
      startDate: {
        type: "string",
        format: "date",
        title: "Start Date",
      },
    },
    required: ["id", "email", "age", "department"],
  };

  // Sample data
  const [rowData] = useState([
    {
      id: "AB1234",
      name: "John Doe",
      email: "john@example.com",
      age: 32,
      salary: 75000,
      department: "Engineering",
      startDate: "2023-01-15",
    },
    {
      id: "CD5678",
      name: "Jane Smith",
      email: "jane@example.com",
      age: 28,
      salary: 82000,
      department: "Marketing",
      startDate: "2022-05-20",
    },
    {
      id: "EF9012",
      name: "Bob Johnson",
      email: "bob@example.com",
      age: 45,
      salary: 95000,
      department: "Sales",
      startDate: "2021-11-10",
    },
  ]);

  return (
    <div className="flex flex-col p-10 h-screen">
      <h1 className="text-2xl font-bold mb-6">AG Grid Schema Validator Demo</h1>

      <div className="mb-6">
        <p className="mb-2">
          This is a demo of the <code>SchemaGrid</code> component from the{" "}
          <code>ag-grid-schema-validator</code> package.
        </p>
        <p>
          Edit cells to see validation in action. Cells with errors will be
          highlighted.
        </p>
      </div>

      {/* Simple usage example */}
      <SchemaGrid
        jsonSchema={jsonSchema}
        rowData={rowData}
        theme="ag-theme-alpine"
        height="400px"
        pagination={true}
        paginationPageSize={10}
        onValidationError={(errors) =>
          console.log("Validation errors:", errors)
        }
      />
    </div>
  );
}
