/**
 * Seed Skill Tests into the database.
 * Creates tests for: C, Java, Python, SQL, Data Structures, Aptitude, Web Development
 * Each subject has 1 full test + 2-3 topic-wise tests.
 * Each test has 10-15 MCQ questions with explanations.
 */
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

// ============================================================
// Question banks — each subject has full + topic tests
// ============================================================

const SUBJECTS = [
  {
    subject: 'c',
    name: 'C Programming',
    icon: '🔧',
    color: 'from-blue-500/15 to-cyan-500/15',
    borderColor: 'border-blue-500/30',
    description: 'Master C programming fundamentals — operators, functions, pointers, structures, and memory management.',
    topics: [
      { slug: 'operators', title: 'C — Operators & Expressions', description: 'Arithmetic, relational, logical, bitwise, and assignment operators in C.' },
      { slug: 'functions', title: 'C — Functions & Recursion', description: 'Function declarations, parameters, return values, recursion, and scope.' },
      { slug: 'pointers', title: 'C — Pointers & Memory', description: 'Pointer arithmetic, dynamic memory, arrays vs pointers, and memory leaks.' },
    ],
    fullTitle: 'C Programming — Full Test',
    fullDescription: 'Comprehensive test covering operators, functions, pointers, structures, arrays, and memory management.',
  },
  {
    subject: 'java',
    name: 'Java',
    icon: '☕',
    color: 'from-orange-500/15 to-amber-500/15',
    borderColor: 'border-orange-500/30',
    description: 'Core Java concepts — OOP, collections, multithreading, exception handling, and JDBC.',
    topics: [
      { slug: 'oops', title: 'Java — OOP Concepts', description: 'Classes, objects, inheritance, polymorphism, encapsulation, abstraction.' },
      { slug: 'collections', title: 'Java — Collections Framework', description: 'List, Set, Map, Queue, iterators, and generics.' },
      { slug: 'exceptions', title: 'Java — Exception Handling', description: 'Try-catch-finally, checked vs unchecked, custom exceptions.' },
    ],
    fullTitle: 'Java — Full Test',
    fullDescription: 'Complete Java assessment covering OOP, collections, threading, exceptions, and Java 8+ features.',
  },
  {
    subject: 'python',
    name: 'Python',
    icon: '🐍',
    color: 'from-emerald-500/15 to-yellow-500/15',
    borderColor: 'border-emerald-500/30',
    description: 'Python programming — data types, OOP, decorators, generators, and standard library.',
    topics: [
      { slug: 'basics', title: 'Python — Basics & Data Types', description: 'Variables, lists, tuples, dicts, sets, strings, slicing.' },
      { slug: 'oop', title: 'Python — OOP & Decorators', description: 'Classes, inheritance, dunder methods, decorators, properties.' },
      { slug: 'advanced', title: 'Python — Advanced Concepts', description: 'Generators, lambdas, map/filter/reduce, list comprehensions, GIL.' },
    ],
    fullTitle: 'Python — Full Test',
    fullDescription: 'Full Python assessment covering syntax, data structures, OOP, decorators, generators, and file handling.',
  },
  {
    subject: 'sql',
    name: 'SQL & Databases',
    icon: '🗄️',
    color: 'from-violet-500/15 to-purple-500/15',
    borderColor: 'border-violet-500/30',
    description: 'SQL queries, joins, aggregations, subqueries, normalization, and indexing.',
    topics: [
      { slug: 'joins', title: 'SQL — Joins & Set Operations', description: 'INNER, LEFT, RIGHT, FULL joins, UNION, INTERSECT, EXCEPT.' },
      { slug: 'aggregation', title: 'SQL — Aggregation & Grouping', description: 'GROUP BY, HAVING, COUNT, SUM, AVG, window functions.' },
      { slug: 'subqueries', title: 'SQL — Subqueries & CTEs', description: 'Correlated subqueries, EXISTS, WITH clauses, recursive CTEs.' },
    ],
    fullTitle: 'SQL — Full Test',
    fullDescription: 'Complete SQL assessment covering SELECT, joins, aggregation, subqueries, normalization, and performance.',
  },
  {
    subject: 'data-structures',
    name: 'Data Structures & Algorithms',
    icon: '📊',
    color: 'from-rose-500/15 to-pink-500/15',
    borderColor: 'border-rose-500/30',
    description: 'Arrays, linked lists, trees, graphs, sorting, searching, and complexity analysis.',
    topics: [
      { slug: 'arrays-linked-lists', title: 'DSA — Arrays & Linked Lists', description: 'Array operations, singly/doubly linked lists, circular lists.' },
      { slug: 'trees', title: 'DSA — Trees & BST', description: 'Binary trees, BST, traversals, AVL, heaps.' },
      { slug: 'sorting-searching', title: 'DSA — Sorting & Searching', description: 'Bubble, merge, quick sort, binary search, hash tables.' },
    ],
    fullTitle: 'DSA — Full Test',
    fullDescription: 'Complete DSA assessment covering arrays, linked lists, trees, graphs, sorting, searching, and complexity.',
  },
  {
    subject: 'aptitude',
    name: 'Aptitude & Reasoning',
    icon: '🧮',
    color: 'from-cyan-500/15 to-blue-500/15',
    borderColor: 'border-cyan-500/30',
    description: 'Quantitative aptitude, logical reasoning, and verbal ability for placement exams.',
    topics: [
      { slug: 'quantitative', title: 'Aptitude — Quantitative', description: 'Time & work, speed & distance, percentages, profit & loss, ratio.' },
      { slug: 'logical', title: 'Aptitude — Logical Reasoning', description: 'Series, coding-decoding, blood relations, directions, puzzles.' },
      { slug: 'verbal', title: 'Aptitude — Verbal Ability', description: 'Synonyms, antonyms, sentence correction, reading comprehension.' },
    ],
    fullTitle: 'Aptitude — Full Test',
    fullDescription: 'Complete aptitude test covering quantitative, logical reasoning, and verbal ability — for placement exams.',
  },
  {
    subject: 'web-development',
    name: 'Web Development',
    icon: '🌐',
    color: 'from-amber-500/15 to-orange-500/15',
    borderColor: 'border-amber-500/30',
    description: 'HTML, CSS, JavaScript, React, HTTP, REST APIs, and web security basics.',
    topics: [
      { slug: 'html-css', title: 'Web Dev — HTML & CSS', description: 'Semantic HTML, Flexbox, Grid, responsive design, animations.' },
      { slug: 'javascript', title: 'Web Dev — JavaScript', description: 'ES6+, closures, promises, async/await, DOM manipulation, events.' },
      { slug: 'react', title: 'Web Dev — React & APIs', description: 'Components, hooks, state, REST APIs, fetch, HTTP methods.' },
    ],
    fullTitle: 'Web Development — Full Test',
    fullDescription: 'Complete web dev assessment covering HTML, CSS, JavaScript, React, HTTP, and REST API concepts.',
  },
]

// ============================================================
// Question generator — produces MCQs for each subject/topic
// ============================================================

function getQuestions(subject, topic) {
  const Q = (question, options, correctIdx, explanation) => ({
    question, options: JSON.stringify(options), correctIdx, explanation
  })

  // C Programming
  if (subject === 'c') {
    if (topic === 'operators' || topic === 'full') {
      return [
        Q('What is the output of: printf("%d", 5 % 2);', ['1', '2', '2.5', '0'], 0, 'The modulo operator % returns the remainder. 5 / 2 = 2 remainder 1.'),
        Q('Which operator has the highest precedence?', ['+', '*', '()', '='], 2, 'Parentheses () have the highest precedence in C, used to override default precedence.'),
        Q('What does the expression "x += 5" evaluate to if x = 10?', ['x = 5', 'x = 10', 'x = 15', 'x = 50'], 2, '+= is a compound assignment operator. x += 5 is equivalent to x = x + 5 = 15.'),
        Q('What is the result of: 10 & 6 (bitwise AND)?', ['2', '14', '12', '0'], 0, '10 = 1010, 6 = 0110. AND = 0010 = 2.'),
        Q('Which is NOT a logical operator in C?', ['&&', '||', '!', '^^'], 3, 'C uses && (AND), || (OR), ! (NOT). There is no ^^ operator.'),
        Q('What is the output: int x = 5; printf("%d", x++);', ['5', '6', '7', '0'], 0, 'Post-increment (x++) returns the current value (5) then increments. Output is 5.'),
        Q('What does the sizeof operator return?', ['Size in bytes', 'Size in bits', 'Number of elements', 'Address'], 0, 'sizeof returns the size of a type or variable in bytes.'),
        Q('What is: int a = 3, b = 5; a = a > b ? a : b; printf("%d", a);', ['3', '5', '8', '0'], 1, 'Ternary: a > b is false, so a = b = 5.'),
      ]
    }
    if (topic === 'functions' || topic === 'full') {
      return [
        Q('What is the default return type of a function in C if not specified?', ['int', 'void', 'char', 'float'], 0, 'In older C standards (C89), if no return type is specified, it defaults to int. Modern C requires explicit types.'),
        Q('Which keyword is used to pass arguments by reference in C?', ['ref', '&', 'pointer', 'pass'], 2, 'C uses pointers to pass arguments by reference, allowing functions to modify the original variables.'),
        Q('What is recursion?', ['A function calling itself', 'A function calling another function', 'A loop construct', 'A type of variable'], 0, 'Recursion is when a function calls itself, typically with a base case to terminate.'),
        Q('What is the scope of a variable declared inside a function?', ['Global', 'Local', 'Static', 'External'], 1, 'Variables declared inside a function have local scope — they exist only within that function.'),
        Q('What does "static" do when applied to a local variable?', ['Makes it global', 'Preserves value between function calls', 'Makes it constant', 'Removes it from memory'], 1, 'A static local variable retains its value between function calls but remains local in scope.'),
        Q('What is the purpose of "void" as a return type?', ['Returns 0', 'Returns nothing', 'Returns a pointer', 'Returns any type'], 1, 'void means the function does not return a value.'),
        Q('Can a function return multiple values in C?', ['Yes, directly', 'Yes, using pointers', 'No, never', 'Only in C99'], 1, 'C functions return one value, but you can simulate multiple returns using pointers or structures.'),
        Q('What is a function prototype?', ['The function definition', 'A declaration of the function signature', 'The function call', 'The function body'], 1, 'A prototype declares the function name, return type, and parameters before its actual definition.'),
      ]
    }
    if (topic === 'pointers' || topic === 'full') {
      return [
        Q('What does the & operator do in C?', ['Bitwise AND', 'Address-of operator', 'Logical AND', 'Reference'], 1, 'The & operator returns the memory address of a variable.'),
        Q('What does *p mean when p is a pointer?', ['Multiply p', 'Value at address p', 'Address of p', 'Size of p'], 1, 'The * operator dereferences a pointer — it returns the value stored at the address.'),
        Q('What is a NULL pointer?', ['A pointer to 0', 'A pointer that points to nothing', 'A pointer to address 0', 'All of the above'], 3, 'A NULL pointer is a pointer that points to nothing. It has the value 0 (or NULL macro).'),
        Q('What does malloc() return?', ['A pointer to allocated memory', 'An integer', 'A character', 'Nothing'], 0, 'malloc() returns a void pointer to the first byte of the allocated memory block.'),
        Q('What is the difference between malloc and calloc?', ['calloc initializes to 0, malloc does not', 'malloc is faster', 'calloc allocates more memory', 'There is no difference'], 0, 'calloc() initializes all allocated bytes to 0, while malloc() does not.'),
        Q('What happens if you forget to free() allocated memory?', ['Compile error', 'Memory leak', 'Segmentation fault', 'Nothing'], 1, 'Forgetting to free() allocated memory causes a memory leak — the memory remains allocated but unusable.'),
        Q('What is pointer arithmetic?', ['Adding numbers to pointers', 'Multiplying pointers', 'Dividing pointers', 'Comparing pointers'], 0, 'Pointer arithmetic involves adding/subtracting integers from pointers to traverse arrays.'),
        Q('What is a dangling pointer?', ['A pointer to a freed memory', 'A pointer to NULL', 'A pointer to a function', 'A pointer to a constant'], 0, 'A dangling pointer points to memory that has been freed or deallocated.'),
      ]
    }
  }

  // Java
  if (subject === 'java') {
    if (topic === 'oops' || topic === 'full') {
      return [
        Q('Which keyword is used to inherit a class in Java?', ['implements', 'extends', 'inherits', 'super'], 1, 'The extends keyword is used for class inheritance in Java.'),
        Q('What is polymorphism?', ['Multiple constructors', 'One interface, many forms', 'Multiple classes', 'Multiple packages'], 1, 'Polymorphism allows one interface to have multiple implementations (method overloading and overriding).'),
        Q('Which keyword prevents method overriding?', ['static', 'final', 'private', 'abstract'], 1, 'The final keyword prevents a method from being overridden in subclasses.'),
        Q('What is encapsulation?', ['Hiding data using access modifiers', 'Creating multiple objects', 'Using inheritance', 'Method overloading'], 0, 'Encapsulation is the bundling of data and methods, with access controlled via private/public/protected.'),
        Q('Can an abstract class have a constructor?', ['No', 'Yes', 'Only if it has no abstract methods', 'Only in interfaces'], 1, 'Abstract classes can have constructors, but they are called via super() when a subclass is instantiated.'),
        Q('What is the difference between == and .equals()?', ['No difference', '== compares references, .equals() compares values', '== compares values, .equals() compares references', '== is faster'], 1, '== compares object references (memory addresses), while .equals() compares content/values (if overridden).'),
        Q('What does the "super" keyword do?', ['Calls parent constructor', 'Calls parent method', 'Accesses parent field', 'All of the above'], 3, 'super can be used to call the parent constructor, access parent methods, and access parent fields.'),
        Q('Which is NOT a principle of OOP?', ['Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism'], 2, 'The four principles of OOP are: encapsulation, inheritance, polymorphism, and abstraction. Compilation is not an OOP principle.'),
      ]
    }
    if (topic === 'collections' || topic === 'full') {
      return [
        Q('Which interface does ArrayList implement?', ['Map', 'List', 'Set', 'Queue'], 1, 'ArrayList implements the List interface, allowing ordered, duplicate elements.'),
        Q('What is the difference between HashMap and Hashtable?', ['HashMap is synchronized', 'Hashtable is synchronized', 'No difference', 'Hashtable allows null keys'], 1, 'Hashtable is synchronized (thread-safe) while HashMap is not. HashMap allows null keys/values.'),
        Q('Which collection does NOT allow duplicates?', ['ArrayList', 'LinkedList', 'HashSet', 'Vector'], 2, 'HashSet implements the Set interface, which does not allow duplicate elements.'),
        Q('What is the time complexity of HashMap.get()?', ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], 0, 'HashMap.get() has O(1) average time complexity due to hashing.'),
        Q('What does Collections.sort() use internally?', ['Bubble sort', 'Merge sort', 'Quick sort', 'Tim sort'], 3, 'Collections.sort() uses Tim Sort (a hybrid of merge sort and insertion sort) since Java 7.'),
        Q('What is the difference between List and Set?', ['List allows duplicates, Set does not', 'Set allows duplicates, List does not', 'No difference', 'List is faster'], 0, 'List allows duplicate elements and maintains insertion order. Set does not allow duplicates.'),
        Q('Which queue follows FIFO?', ['PriorityQueue', 'ArrayDeque', 'LinkedList as Queue', 'Stack'], 2, 'When used as a Queue, LinkedList follows FIFO (First In First Out) order.'),
        Q('What is generics in Java?', ['Type safety at compile time', 'A way to create generic objects', 'A type of loop', 'A memory management feature'], 0, 'Generics provide compile-time type safety, allowing you to specify the type of elements a collection can hold.'),
      ]
    }
    if (topic === 'exceptions' || topic === 'full') {
      return [
        Q('Which keyword is used to handle exceptions?', ['catch', 'throw', 'try', 'finally'], 2, 'The try block is used to wrap code that might throw an exception. catch handles it.'),
        Q('What is a checked exception?', ['RuntimeException', 'An exception checked at compile time', 'An error', 'A NullPointerException'], 1, 'Checked exceptions are verified at compile time (e.g., IOException). The compiler requires you to handle them.'),
        Q('Which is NOT an unchecked exception?', ['NullPointerException', 'ArrayIndexOutOfBoundsException', 'IOException', 'ArithmeticException'], 2, 'IOException is a checked exception. The others are unchecked (extend RuntimeException).'),
        Q('What does the finally block do?', ['Always executes', 'Executes only on success', 'Executes only on exception', 'Optional'], 0, 'The finally block always executes, regardless of whether an exception occurred or not.'),
        Q('Can you have try without catch?', ['No', 'Yes, with finally', 'Yes, without finally', 'Only in Java 8+'], 1, 'You can have try-finally without catch, but you must have at least one of catch or finally.'),
        Q('What is the purpose of "throw" keyword?', ['To catch an exception', 'To explicitly throw an exception', 'To handle an exception', 'To ignore an exception'], 1, 'The throw keyword is used to explicitly throw an exception object.'),
        Q('Can you create custom exceptions?', ['No', 'Yes, by extending Exception or RuntimeException', 'Only by extending Error', 'Only using annotations'], 1, 'You can create custom exceptions by extending Exception (checked) or RuntimeException (unchecked).'),
        Q('What happens if an exception is not caught?', ['Program continues', 'Program terminates', 'Exception is ignored', 'Exception is stored'], 1, 'If an exception is not caught, the program terminates and prints the stack trace.'),
      ]
    }
  }

  // Python
  if (subject === 'python') {
    if (topic === 'basics' || topic === 'full') {
      return [
        Q('What is the output: print(type([1, 2, 3]))?', ['<class list>', '<class tuple>', '<class dict>', '<class set>'], 0, 'type([1,2,3]) returns <class \'list\'> since [] creates a list.'),
        Q('Which is immutable in Python?', ['list', 'dict', 'tuple', 'set'], 2, 'Tuples are immutable — their elements cannot be changed after creation.'),
        Q('What does len("hello") return?', ['4', '5', '6', 'Error'], 1, 'len("hello") returns 5 — the number of characters in the string.'),
        Q('What is the output: print(2 ** 3)?', ['6', '8', '9', 'Error'], 1, '** is the exponentiation operator. 2 ** 3 = 2 * 2 * 2 = 8.'),
        Q('Which method adds an element to the end of a list?', ['.add()', '.append()', '.insert()', '.push()'], 1, '.append() adds an element to the end of a list. .add() is for sets.'),
        Q('What does "hello"[1:4]" return?', ['hel', 'ell', 'ello', 'hell'], 1, 'Slicing [1:4] returns characters at index 1, 2, 3 = "ell".'),
        Q('What is the output: print(10 // 3)?', ['3.33', '3', '4', '3.0'], 1, '// is floor division. 10 // 3 = 3 (integer result, floor of 3.33).'),
        Q('Which is NOT a valid dictionary operation?', ['d[key]', 'd.get(key)', 'd.keys()', 'd.sort()'], 3, 'Dictionaries are unordered (pre-3.7), so .sort() is not a valid dict method.'),
      ]
    }
    if (topic === 'oop' || topic === 'full') {
      return [
        Q('How do you define a class in Python?', ['class MyClass:', 'class MyClass()', 'def MyClass:', 'create MyClass:'], 0, 'Python uses the class keyword followed by the class name and a colon.'),
        Q('What is __init__ in Python?', ['A destructor', 'A constructor', 'A static method', 'A property'], 1, '__init__ is the constructor method called when an object is instantiated.'),
        Q('What does "self" refer to in a class method?', ['The class itself', 'The instance object', 'A static variable', 'The parent class'], 1, 'self refers to the current instance of the class, similar to "this" in Java.'),
        Q('How do you create an inherited class?', ['class Child(Parent):', 'class Child extends Parent:', 'class Child inherits Parent:', 'class Child: Parent'], 0, 'Python uses parentheses for inheritance: class Child(Parent):'),
        Q('What is a decorator in Python?', ['A function that modifies another function', 'A type of class', 'A string formatter', 'A loop construct'], 0, 'A decorator is a function that takes another function and extends its behavior without modifying it.'),
        Q('What does @property do?', ['Makes a method static', 'Makes a method behave like an attribute', 'Creates a private variable', 'Defines a class property'], 1, '@property turns a method into a read-only attribute, accessible without parentheses.'),
        Q('What is a dunder method?', ['A method with __ prefix/suffix', 'A method that is deprecated', 'A private method', 'A static method'], 0, 'Dunder (double underscore) methods like __init__, __str__, __len__ are special methods in Python.'),
        Q('Can Python have multiple inheritance?', ['No', 'Yes', 'Only with interfaces', 'Only in Python 3+'], 1, 'Python supports multiple inheritance — a class can inherit from multiple parent classes.'),
      ]
    }
    if (topic === 'advanced' || topic === 'full') {
      return [
        Q('What is a generator in Python?', ['A function that returns a list', 'A function that yields values one at a time', 'A type of loop', 'A class attribute'], 1, 'A generator uses yield to produce values lazily, one at a time, without storing them all in memory.'),
        Q('What does lambda do?', ['Defines a function', 'Defines an anonymous function', 'Creates a list', 'Sorts elements'], 1, 'lambda creates a small anonymous function: lambda x: x * 2'),
        Q('What is the output: print(list(map(lambda x: x*2, [1,2,3])))?', ['[1,2,3]', '[2,4,6]', '[1,4,9]', 'Error'], 1, 'map applies the lambda to each element: 1*2, 2*2, 3*2 = [2,4,6].'),
        Q('What is a list comprehension?', ['[x for x in iterable]', 'A loop inside a list', 'A way to sort lists', 'A type of generator'], 0, 'List comprehension: [expression for item in iterable if condition]'),
        Q('What is the GIL in Python?', ['Global Import Library', 'Global Interpreter Lock', 'General Iteration Loop', 'Garbage Collection Lock'], 1, 'The GIL (Global Interpreter Lock) prevents multiple native threads from executing Python bytecodes simultaneously.'),
        Q('What does "yield" do?', ['Returns a value and exits', 'Returns a value and pauses', 'Creates a list', 'Imports a module'], 1, 'yield returns a value and pauses the function, resuming from where it left off on the next call.'),
        Q('What is the difference between is and ==?', ['No difference', 'is checks identity, == checks equality', 'is checks equality, == checks identity', 'is is faster'], 1, 'is checks if two variables point to the same object (identity). == checks if values are equal.'),
        Q('What does "with open(file) as f:" do?', ['Opens a file permanently', 'Opens a file and auto-closes it', 'Creates a file', 'Reads entire file'], 1, 'The with statement ensures the file is automatically closed when the block exits, even on exceptions.'),
      ]
    }
  }

  // SQL
  if (subject === 'sql') {
    if (topic === 'joins' || topic === 'full') {
      return [
        Q('Which JOIN returns all rows from the LEFT table even if no match in RIGHT?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'], 1, 'LEFT JOIN returns all rows from the left table, with NULLs for unmatched right table columns.'),
        Q('What is the difference between UNION and UNION ALL?', ['UNION removes duplicates', 'UNION ALL is slower', 'No difference', 'UNION ALL removes duplicates'], 0, 'UNION removes duplicate rows from the result. UNION ALL keeps all rows including duplicates.'),
        Q('Which JOIN returns matched rows from BOTH tables only?', ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], 2, 'INNER JOIN returns only rows that have matching values in both tables.'),
        Q('What does a CROSS JOIN produce?', ['Matched rows', 'Cartesian product', 'No rows', 'Unique rows'], 1, 'CROSS JOIN produces a Cartesian product — every row from table A combined with every row from table B.'),
        Q('How many rows does FULL OUTER JOIN return?', ['Only matched', 'All from left', 'All from both tables', 'Only unmatched'], 2, 'FULL OUTER JOIN returns all rows from both tables, with NULLs where there is no match.'),
        Q('Which is NOT a valid JOIN type?', ['LEFT JOIN', 'INNER JOIN', 'MIDDLE JOIN', 'RIGHT JOIN'], 2, 'There is no MIDDLE JOIN. Valid types: INNER, LEFT, RIGHT, FULL, CROSS, SELF.'),
        Q('What is a SELF JOIN?', ['Joining a table to itself', 'Joining without a condition', 'A join that returns one row', 'A type of inner join'], 0, 'A SELF JOIN is when a table is joined with itself using aliases, common for hierarchical data.'),
        Q('What keyword is used to filter after GROUP BY?', ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'], 1, 'HAVING is used to filter groups after GROUP BY. WHERE filters rows before grouping.'),
      ]
    }
    if (topic === 'aggregation' || topic === 'full') {
      return [
        Q('Which function counts non-NULL values?', ['COUNT(*)', 'COUNT(column)', 'COUNT(DISTINCT)', 'SUM()'], 1, 'COUNT(column) counts non-NULL values in the column. COUNT(*) counts all rows.'),
        Q('What does GROUP BY do?', ['Sorts rows', 'Groups rows by column values', 'Filters rows', 'Joins tables'], 1, 'GROUP BY groups rows that have the same values in specified columns, typically for aggregation.'),
        Q('What is the difference between WHERE and HAVING?', ['WHERE filters before grouping, HAVING after', 'No difference', 'HAVING is faster', 'WHERE is for joins'], 0, 'WHERE filters individual rows before GROUP BY. HAVING filters groups after GROUP BY.'),
        Q('What does AVG() ignore?', ['Zeros', 'NULL values', 'Duplicates', 'Negative numbers'], 1, 'AVG() ignores NULL values when computing the average.'),
        Q('What does COUNT(DISTINCT column) return?', ['All rows', 'Number of unique non-NULL values', 'Number of NULLs', 'Sum of values'], 1, 'COUNT(DISTINCT column) returns the number of unique, non-NULL values in the column.'),
        Q('Which is NOT an aggregate function?', ['SUM', 'AVG', 'MAX', 'CONCAT'], 3, 'CONCAT is a string function, not an aggregate. SUM, AVG, MAX, MIN, COUNT are aggregates.'),
        Q('What does the SUM() function return if no rows match?', ['0', 'NULL', 'Error', '0.0'], 1, 'SUM() returns NULL if no rows match the condition. Use COALESCE(SUM(x), 0) to get 0.'),
        Q('Can you use aggregate functions in WHERE?', ['Yes', 'No, use HAVING', 'Only in subqueries', 'Only in JOINs'], 1, 'Aggregate functions cannot be used in WHERE. Use HAVING after GROUP BY instead.'),
      ]
    }
    if (topic === 'subqueries' || topic === 'full') {
      return [
        Q('What is a correlated subquery?', ['A query that references the outer query', 'A query with no joins', 'A query that returns one row', 'A recursive query'], 0, 'A correlated subquery references columns from the outer query and executes once per row.'),
        Q('What does EXISTS return?', ['True/False', 'A table', 'A number', 'A column'], 0, 'EXISTS returns True if the subquery returns at least one row, False otherwise.'),
        Q('What is a CTE?', ['A temporary named result set', 'A type of join', 'A constraint', 'A stored procedure'], 0, 'A CTE (Common Table Expression) is a temporary named result set defined with WITH, used within a single query.'),
        Q('Which keyword creates a CTE?', ['TEMP', 'WITH', 'AS', 'DECLARE'], 1, 'The WITH keyword creates a CTE: WITH cte_name AS (SELECT ...).'),
        Q('Can a subquery return multiple rows?', ['No', 'Yes, with IN or ANY', 'Only with JOIN', 'Only in stored procedures'], 1, 'Subqueries returning multiple rows can be used with IN, ANY, or ALL operators.'),
        Q('What is a scalar subquery?', ['Returns one row and one column', 'Returns multiple rows', 'Returns no rows', 'Returns a table'], 0, 'A scalar subquery returns exactly one value (one row, one column) and can be used in comparisons.'),
        Q('What does a recursive CTE do?', ['Calls itself', 'References itself to build hierarchical data', 'Creates a loop', 'Optimizes queries'], 1, 'A recursive CTE references itself, commonly used for hierarchical data like org charts or tree structures.'),
        Q('Which is faster: IN or EXISTS?', ['Always IN', 'Always EXISTS', 'Depends on data', 'They are identical'], 2, 'Performance depends on data. EXISTS is typically faster for large outer tables, IN for small outer tables.'),
      ]
    }
  }

  // Data Structures
  if (subject === 'data-structures') {
    if (topic === 'arrays-linked-lists' || topic === 'full') {
      return [
        Q('What is the time complexity of accessing an array element by index?', ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], 0, 'Array access by index is O(1) — constant time, because arrays use contiguous memory.'),
        Q('What is the time complexity of inserting at the head of a singly linked list?', ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], 0, 'Inserting at the head of a linked list is O(1) — just update the head pointer.'),
        Q('What is the main disadvantage of arrays vs linked lists?', ['Arrays are slower', 'Arrays have fixed size', 'Arrays use more memory', 'Arrays cannot be sorted'], 1, 'Arrays have a fixed size once allocated. Linked lists can grow/shrink dynamically.'),
        Q('What is the time complexity of searching in an unsorted array?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2, 'Searching an unsorted array requires linear scan — O(n).'),
        Q('In a doubly linked list, each node has how many pointers?', ['1', '2', '3', '0'], 1, 'A doubly linked list node has two pointers: next and prev (previous).'),
        Q('What is the space complexity of an array of n elements?', ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], 1, 'An array of n elements uses O(n) space.'),
        Q('What is a circular linked list?', ['The last node points to the first', 'A list that cannot be traversed', 'A list with no head', 'A sorted list'], 0, 'In a circular linked list, the last node points back to the first node, forming a cycle.'),
        Q('What is the worst case for inserting at the end of a singly linked list?', ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 2, 'Inserting at the end requires traversing the entire list — O(n) without a tail pointer.'),
      ]
    }
    if (topic === 'trees' || topic === 'full') {
      return [
        Q('What is the height of a balanced binary tree with n nodes?', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 1, 'A balanced binary tree has height O(log n), ensuring efficient operations.'),
        Q('What traversal visits root, left, then right?', ['Inorder', 'Preorder', 'Postorder', 'Level-order'], 1, 'Preorder traversal visits: Root → Left → Right.'),
        Q('In a BST, what is the time complexity of searching?', ['O(1)', 'O(n) worst case, O(log n) average', 'O(n^2)', 'O(n log n)'], 1, 'BST search is O(log n) average for balanced trees, O(n) worst case for skewed trees.'),
        Q('What is the property of a BST?', ['Left > Right', 'Left < Root < Right', 'All nodes are equal', 'No order'], 1, 'In a BST, all left subtree nodes are less than root, all right subtree nodes are greater.'),
        Q('What is an AVL tree?', ['A self-balancing BST', 'A type of heap', 'A binary tree with 2 children', 'A sorted array'], 0, 'An AVL tree is a self-balancing BST where the height difference between subtrees is at most 1.'),
        Q('What is the height of an AVL tree with n nodes?', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 1, 'AVL trees maintain O(log n) height through rotations, ensuring all operations are O(log n).'),
        Q('What is a heap?', ['A complete binary tree with heap property', 'A sorted array', 'A type of BST', 'A linked list'], 0, 'A heap is a complete binary tree where parent is ≥ (max-heap) or ≤ (min-heap) all children.'),
        Q('Which traversal of a BST gives sorted output?', ['Preorder', 'Inorder', 'Postorder', 'Level-order'], 1, 'Inorder traversal (Left → Root → Right) of a BST produces elements in sorted order.'),
      ]
    }
    if (topic === 'sorting-searching' || topic === 'full') {
      return [
        Q('What is the time complexity of Quick Sort (average)?', ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'], 1, 'Quick Sort average case is O(n log n). Worst case is O(n^2) with poor pivot selection.'),
        Q('What is the time complexity of Binary Search?', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1, 'Binary search halves the search space each iteration — O(log n).'),
        Q('Which sorting algorithm is stable?', ['Quick Sort', 'Merge Sort', 'Heap Sort', 'Selection Sort'], 1, 'Merge Sort is stable — it preserves the relative order of equal elements. Quick Sort and Heap Sort are not.'),
        Q('What is the space complexity of Merge Sort?', ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'], 1, 'Merge Sort requires O(n) additional space for the temporary merge array.'),
        Q('What is the worst-case time complexity of Quick Sort?', ['O(n)', 'O(n log n)', 'O(n^2)', 'O(n^3)'], 2, 'Quick Sort worst case is O(n^2) when the pivot is always the smallest or largest element.'),
        Q('Which algorithm has O(n^2) average time complexity?', ['Merge Sort', 'Quick Sort', 'Bubble Sort', 'Heap Sort'], 2, 'Bubble Sort has O(n^2) average and worst-case time complexity.'),
        Q('What data structure does Binary Search require?', ['Linked List', 'Sorted Array', 'Hash Table', 'Tree'], 1, 'Binary Search requires a sorted array (or any data structure that allows O(1) random access).'),
        Q('What is the time complexity of inserting into a hash table (average)?', ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], 0, 'Hash table insertion is O(1) average. Worst case (all collisions) is O(n).'),
      ]
    }
  }

  // Aptitude
  if (subject === 'aptitude') {
    if (topic === 'quantitative' || topic === 'full') {
      return [
        Q('If a train travels 360 km in 4 hours, what is its speed?', ['90 km/h', '120 km/h', '1440 km/h', '60 km/h'], 0, 'Speed = Distance / Time = 360 / 4 = 90 km/h.'),
        Q('A shopkeeper sells an item for ₹1200 with 20% profit. What is the cost price?', ['₹1000', '₹960', '₹800', '₹1440'], 0, 'CP = SP / (1 + profit%) = 1200 / 1.20 = ₹1000.'),
        Q('If 15 workers complete a job in 8 days, how many days for 12 workers?', ['10 days', '12 days', '6 days', '9.6 days'], 0, 'Work = 15 × 8 = 120 worker-days. Days for 12 workers = 120 / 12 = 10 days.'),
        Q('What is 25% of 480?', ['100', '120', '96', '125'], 1, '25% of 480 = 0.25 × 480 = 120.'),
        Q('If A:B = 3:4 and B:C = 6:7, what is A:C?', ['3:7', '9:14', '18:28', '3:4'], 1, 'A:B = 3:4 = 9:12, B:C = 6:7 = 12:14. So A:C = 9:14.'),
        Q('A number increased by 20% gives 72. What is the number?', ['60', '65', '50', '70'], 0, 'Let x be the number. x × 1.20 = 72 → x = 72 / 1.2 = 60.'),
        Q('The average of 5 numbers is 18. If one number is removed, average becomes 16. What is the removed number?', ['20', '24', '26', '18'], 2, 'Sum of 5 = 5×18 = 90. Sum of 4 = 4×16 = 64. Removed = 90 - 64 = 26.'),
        Q('If compound interest on ₹5000 at 10% for 2 years, what is the amount?', ['₹6000', '₹6050', '₹6100', '₹5500'], 1, 'A = 5000 × (1.10)^2 = 5000 × 1.21 = ₹6050.'),
      ]
    }
    if (topic === 'logical' || topic === 'full') {
      return [
        Q('Find the next number: 2, 6, 12, 20, 30, ?', ['36', '40', '42', '44'], 2, 'Differences: 4, 6, 8, 10, 12. Next = 30 + 12 = 42.'),
        Q('If CODING is 3154957, what is ING?', ['957', '495', '157', '357'], 0, 'I=9, N=5, G=7. So ING = 957.'),
        Q('Pointing to a man, Priya said "His father is my grandfather\'s only son." How is the man related to Priya?', ['Father', 'Uncle', 'Brother', 'Grandfather'], 0, 'Grandfather\'s only son = Priya\'s father. His father = Priya\'s father → the man is Priya\'s father.'),
        Q('If South-East becomes North, then what does North-East become?', ['West', 'North-West', 'South', 'East'], 0, 'Rotate 135° clockwise. North-East + 135° = West.'),
        Q('Which number does NOT belong: 3, 5, 7, 9, 11, 13?', ['3', '5', '9', '11'], 2, '9 is the only non-prime number in the list (9 = 3 × 3).'),
        Q('Complete: A, C, E, G, I, ?', ['J', 'K', 'L', 'M'], 1, 'Skip one letter: A(+2)C(+2)E(+2)G(+2)I(+2)K.'),
        Q('If MONDAY is coded as NPOEBZ, how is FRIDAY coded?', ['GSJEBZ', 'ESJCZB', 'GSJEBX', 'ESJEBZ'], 0, 'Each letter shifts +1/-1 alternately: F+1=G, R+1=S, I+1=J, D+1=E, A+1=B, Y+1=Z → GSJEBZ.'),
        Q('5 cats catch 5 mice in 5 minutes. How many cats for 100 mice in 100 minutes?', ['5', '20', '100', '1'], 0, '1 cat catches 1 mouse in 5 min. 100 mice in 100 min needs 5 cats (each catches 20 mice in 100 min).'),
      ]
    }
    if (topic === 'verbal' || topic === 'full') {
      return [
        Q('Choose the synonym: ABUNDANT', ['Scarce', 'Plentiful', 'Limited', 'Rare'], 1, 'Abundant means existing in large quantities — plentiful.'),
        Q('Choose the antonym: TRANSPARENT', ['Clear', 'Opaque', 'Visible', 'Open'], 1, 'Transparent allows light through. Opaque blocks light — the antonym.'),
        Q('Fill in: "She is ___ than her sister."', ['more taller', 'taller', 'tallest', 'most taller'], 1, 'Comparative form: taller (not "more taller" — double comparative is incorrect).'),
        Q('What is the passive voice of "The cat chased the mouse"?', ['The mouse chased the cat', 'The mouse was chased by the cat', 'The mouse is chased', 'The cat was chased'], 1, 'Passive: object becomes subject. "The mouse was chased by the cat."'),
        Q('Choose the correct spelling:', ['Accomodate', 'Acommodate', 'Accommodate', 'Acomodate'], 2, 'Correct spelling: Accommodate (double c, double m).'),
        Q('What does "Benevolent" mean?', ['Kind and generous', 'Evil', 'Harmful', 'Selfish'], 0, 'Benevolent means kind, generous, and well-meaning.'),
        Q('Complete: "Neither the teacher nor the students ___ ready."', ['is', 'are', 'was', 'be'], 1, 'With "neither...nor", the verb agrees with the nearest subject (students → are).'),
        Q('Choose the correct article: "___ honest man"', ['A', 'An', 'The', 'No article'], 1, '"An honest man" — "h" is silent, so we use "an" based on the vowel sound "on-est".'),
      ]
    }
  }

  // Web Development
  if (subject === 'web-development') {
    if (topic === 'html-css' || topic === 'full') {
      return [
        Q('Which HTML tag is used for the largest heading?', ['<h6>', '<head>', '<h1>', '<header>'], 2, '<h1> is the largest heading tag. <h6> is the smallest.'),
        Q('What does CSS stand for?', ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], 1, 'CSS = Cascading Style Sheets. "Cascading" refers to priority scheme for applying rules.'),
        Q('Which CSS property controls text size?', ['text-size', 'font-size', 'text-style', 'font-style'], 1, 'font-size controls the size of text in CSS.'),
        Q('What does Flexbox display:flex create?', ['Grid layout', 'Flexible row/column layout', 'Table layout', 'Absolute positioning'], 1, 'display:flex creates a flex container with flexible items that can grow/shrink.'),
        Q('Which CSS unit is relative to the viewport width?', ['em', 'rem', 'vw', 'px'], 2, 'vw (viewport width) is relative to 1% of the viewport width.'),
        Q('What is the default display value of a <div>?', ['inline', 'block', 'flex', 'none'], 1, '<div> is a block-level element by default — it takes full width.'),
        Q('Which CSS property creates space inside the border?', ['margin', 'padding', 'border', 'spacing'], 1, 'padding creates space inside the element\'s border. margin creates space outside.'),
        Q('What does the "box model" consist of?', ['Content only', 'Content, padding, border, margin', 'Content and margin', 'Content and border'], 1, 'The CSS box model: content → padding → border → margin.'),
      ]
    }
    if (topic === 'javascript' || topic === 'full') {
      return [
        Q('What is the output: console.log(typeof null)?', ['null', 'undefined', 'object', 'number'], 2, 'typeof null returns "object" — this is a known JavaScript bug that cannot be fixed for backward compatibility.'),
        Q('What does "===" check?', ['Value only', 'Type only', 'Value and type', 'Reference only'], 2, '=== checks both value and type (strict equality). == checks value with type coercion.'),
        Q('What is a closure?', ['A function with no parameters', 'A function that retains access to its outer scope', 'A type of loop', 'A way to close a window'], 1, 'A closure is a function that remembers variables from its outer scope even after the outer function returns.'),
        Q('What does async/await do?', ['Creates threads', 'Makes asynchronous code look synchronous', 'Pauses execution', 'Creates promises'], 1, 'async/await is syntactic sugar over promises, making async code easier to read and write.'),
        Q('What is the output: console.log([1,2,3].map(x => x * 2))?', ['[1,2,3]', '[2,4,6]', '[1,4,9]', 'Error'], 1, 'map applies the function to each element: 1*2, 2*2, 3*2 = [2,4,6].'),
        Q('What does "this" refer to in an arrow function?', ['The function itself', 'The enclosing lexical scope', 'The global object', 'undefined'], 1, 'Arrow functions do not have their own "this" — they inherit it from the enclosing lexical scope.'),
        Q('What is a Promise?', ['A guarantee of a value', 'An object representing eventual completion/failure of an async operation', 'A type of callback', 'A synchronous function'], 1, 'A Promise is an object that represents the eventual result of an asynchronous operation.'),
        Q('What does JSON.stringify() do?', ['Parses JSON', 'Converts a JS object to JSON string', 'Creates a JSON object', 'Validates JSON'], 1, 'JSON.stringify() converts a JavaScript object into a JSON string.'),
      ]
    }
    if (topic === 'react' || topic === 'full') {
      return [
        Q('What hook is used for state in React?', ['useEffect', 'useState', 'useContext', 'useMemo'], 1, 'useState is the hook for managing state in functional components.'),
        Q('What does useEffect do?', ['Manages state', 'Handles side effects', 'Creates components', 'Optimizes rendering'], 1, 'useEffect handles side effects like API calls, subscriptions, and DOM manipulation.'),
        Q('What is JSX?', ['A JavaScript library', 'A syntax extension for JavaScript', 'A CSS framework', 'A type of HTML'], 1, 'JSX is a syntax extension that lets you write HTML-like code in JavaScript, compiled by Babel.'),
        Q('What is the Virtual DOM?', ['A copy of the real DOM', 'A lightweight JS representation of the DOM', 'A browser API', 'A React component'], 1, 'The Virtual DOM is a lightweight JavaScript object representing the UI. React diffs it to minimize real DOM updates.'),
        Q('What does the dependency array in useEffect control?', ['Component rendering', 'When the effect runs', 'State changes', 'Props'], 1, 'The dependency array determines when the effect re-runs. Empty [] = run once on mount.'),
        Q('What is a key prop used for?', ['Styling', 'Identifying list items for React reconciliation', 'Security', 'Performance metrics'], 1, 'The key prop helps React identify which list items have changed, aiding efficient re-rendering.'),
        Q('What is props in React?', ['State management', 'Data passed from parent to child component', 'A hook', 'A type of event'], 1, 'Props (properties) are data passed from parent to child components, making components reusable.'),
        Q('Can you modify state directly in React?', ['Yes', 'No, use setState/useState setter', 'Only in class components', 'Only with refs'], 1, 'Never modify state directly. Always use the setter function (setState or useState setter) to trigger re-render.'),
      ]
    }
  }

  // Default — return generic questions if no match
  return [
    Q('What is the time complexity of binary search?', ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'], 1, 'Binary search halves the search space each step — O(log n).'),
    Q('Which data structure uses LIFO?', ['Queue', 'Stack', 'Array', 'Tree'], 1, 'Stack uses LIFO (Last In First Out) — the last element pushed is the first popped.'),
    Q('Which data structure uses FIFO?', ['Queue', 'Stack', 'Tree', 'Graph'], 0, 'Queue uses FIFO (First In First Out) — the first element enqueued is the first dequeued.'),
    Q('What is Big-O notation?', ['A sorting algorithm', 'A way to describe algorithm complexity', 'A data structure', 'A programming language'], 1, 'Big-O describes the upper bound of an algorithm\'s time/space complexity as input grows.'),
  ]
}

// ============================================================
// Main — create all tests
// ============================================================
async function main() {
  let testCount = 0
  let questionCount = 0

  for (const subj of SUBJECTS) {
    // Create full test
    const fullSlug = `${subj.subject}-full-test`
    const existingFull = await prisma.skillTest.findUnique({ where: { slug: fullSlug } })
    if (!existingFull) {
      const test = await prisma.skillTest.create({
        data: {
          title: subj.fullTitle,
          slug: fullSlug,
          subject: subj.subject,
          topic: null,
          testType: 'full',
          description: subj.fullDescription,
          difficulty: 'intermediate',
          durationMin: 20,
          passingScore: 60,
        },
      })
      const questions = getQuestions(subj.subject, 'full')
      for (const q of questions) {
        await prisma.skillTestQuestion.create({
          data: { ...q, testId: test.id },
        })
        questionCount++
      }
      testCount++
      console.log(`  ✓ ${subj.fullTitle} (${questions.length} questions)`)
    } else {
      console.log(`  SKIP (exists): ${subj.fullTitle}`)
    }

    // Create topic-wise tests
    for (const topic of subj.topics) {
      const topicSlug = `${subj.subject}-${topic.slug}`
      const existingTopic = await prisma.skillTest.findUnique({ where: { slug: topicSlug } })
      if (!existingTopic) {
        const test = await prisma.skillTest.create({
          data: {
            title: topic.title,
            slug: topicSlug,
            subject: subj.subject,
            topic: topic.slug,
            testType: 'topic',
            description: topic.description,
            difficulty: 'intermediate',
            durationMin: 10,
            passingScore: 60,
          },
        })
        const questions = getQuestions(subj.subject, topic.slug)
        for (const q of questions) {
          await prisma.skillTestQuestion.create({
            data: { ...q, testId: test.id },
          })
          questionCount++
        }
        testCount++
        console.log(`  ✓ ${topic.title} (${questions.length} questions)`)
      } else {
        console.log(`  SKIP (exists): ${topic.title}`)
      }
    }
  }

  console.log(`\nDone. Created ${testCount} tests with ${questionCount} questions.`)
}

main()
  .catch(function(e) { console.error(e); process.exit(1) })
  .finally(function() { return prisma.$disconnect() })
