

import { EntriesGeneration } from '@/constants';

export const dummyUserMessage = 'What are the basics of Javascript?';


export const dummyMultiLineEntry = {
  front: "Explain the concept of closures in JavaScript",
  back: `Closures in JavaScript are a powerful feature that allows inner functions to access variables from their outer (enclosing) lexical scope. Key points:

1. A closure is created when a function is defined within another function.
2. The inner function has access to variables in its own scope, in the outer function's scope, and in the global scope.
3. The inner function maintains access to these variables even after the outer function has returned.

Example:
\`\`\`javascript
function outerFunction(x) {
  let y = 10;
  function innerFunction() {
    console.log(x + y);
  }
  return innerFunction;
}

const closure = outerFunction(5);
closure(); // Outputs: 15
\`\`\`

Closures are commonly used for:
- Data privacy
- Function factories
- Implementing module patterns`
};


// Create dummy data that follows the schema
export const dummyEntriesGeneration: EntriesGeneration = {
  cardsSummary: "These cards cover basic concepts of JavaScript, including variables, functions, and objects. They don't cover advanced topics or specific frameworks. The cards are designed to reinforce fundamental JavaScript knowledge.",
  cards: [
    {
      front: "What is a variable in JavaScript?",
      back: "A variable is a container for storing data values. In JavaScript, you can declare variables using 'var', 'let', or 'const' keywords."
    },
    // {
    //   front: "How do you define a function in JavaScript?",
    //   back: "A function in JavaScript can be defined using the 'function' keyword, followed by a name, parameters in parentheses, and the function body in curly braces. Example: function greet(name) { return 'Hello, ' + name; }"
    // },
    {
      front: "What is an object in JavaScript?",
      back: "An object in JavaScript is a collection of related data and/or functionality. It consists of key-value pairs, where values can be properties or methods. Objects can be created using object literals {} or the 'new' keyword."
    },
    dummyMultiLineEntry,
  ]
};

