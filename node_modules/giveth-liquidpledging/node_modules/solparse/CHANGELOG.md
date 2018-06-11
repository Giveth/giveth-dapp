### 0.4.0 (unreleased)

 * Build parser on package install
 * Parse array constructors correctly
 * Parse named arguments correctly
 * Parse assembly local bindings correctly
 * Parse missing values when destructuring tuples correctly
 * Add support for Solidity interfaces

### 0.3.0

 * Improve parsing of visibility and storage specifiers
 * Add separate `StateVariableDeclaration` node type
 * Remove `visibility` and `is_constant` keys from `DeclarativeExpression` node
 * Remove many JavaScript grammar rules not valid in Solidity

### 0.2.0

 * Fix CLI with file arguments
 * Fix parsing of array constructors
 * Fix error on braces inside string literals
 * Fix top-level statements in grammar
 * Add missing specifiers to function parameter definition
 * Add missing denominations
 * Allow expressions inside array parts
 * Allow expressions in modifier arguments
 * Add support for parsing inline assembly
 * Treat placeholder as a special AST node
