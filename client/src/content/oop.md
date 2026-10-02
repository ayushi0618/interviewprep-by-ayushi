# OOP

Object-oriented programming is a way of organising code around **objects** — bundles that hold both the data about a thing and the behaviour that belongs to that thing. Instead of scattered functions passing raw data around, you model your problem as things that know their own state and their own rules. Nearly every codebase you will join — Java backends, C++ systems, JavaScript frameworks — is built this way, so interviews treat OOP not as trivia, but as a check of how you think about structure.

## The four pillars

A **class** is the blueprint (fields it will hold, methods it will have); an **object** is a living instance built from that blueprint, with real values in those fields. Four ideas make the paradigm work.

### Encapsulation — keep the insides private

**Encapsulation** means bundling data together with the methods that operate on it, and hiding the data behind those methods. A bank account class keeps `balance` private: outside code cannot reach in and set it to a negative number; it must call `deposit()` or `withdraw()`, where the rules live. The win: the class can change *how* it stores data internally without breaking everyone who uses it, because callers only ever touched the public surface.

### Abstraction — show the essence, hide the machinery

**Abstraction** means exposing a simple interface while the complicated implementation stays invisible. You use `car.start()` without knowing anything about fuel injection. In code it appears as abstract classes and interfaces: an `interface PaymentMethod` declares `pay(amount)` and nothing else; each implementing class — card, UPI, cash — decides *how*. Callers program against the promise and never depend on one implementation's guts.

### Inheritance — reuse by specialising

**Inheritance** lets a child class start from a parent's fields and methods and then add or override. An `ElectricCar extends Car` inherits `drive()` for free and adds `charge()`. It models genuine "is-a" relationships (an electric car **is a** car) and removes duplication — but it welds classes together: change the parent carelessly and every descendant feels it, which is why the next chapters prefer it carefully and sparingly.

### Polymorphism — one name, many behaviours

**Polymorphism** means the same method call behaves according to the actual object you have, not the variable's declared type. `animal.makeSound()` barks when the object is a `Dog` and meows when it is a `Cat`. It comes in two flavours: **compile-time** (method overloading — same name, different parameter lists, resolved while compiling) and **runtime** (method overriding — child replaces parent's method, resolved while running, through virtual dispatch). Polymorphism is the pillar that lets you write loops over a list of mixed objects and have each one do its own correct thing.

```java
class BankAccount {
    private double balance;              // encapsulated: nobody outside can touch this

    void deposit(double amount) {        // the public surface, where the rules live
        if (amount > 0) balance += amount;
    }
    double getBalance() { return balance; }
}

abstract class PaymentMethod {           // abstraction: the promise, no machinery
    abstract void pay(double amount);
}

class CardPayment extends PaymentMethod {  // inheritance: reuse the promise's shape
    @Override
    void pay(double amount) { System.out.println("Paid " + amount + " by card"); }
}
```

## SOLID in plain words

Five design principles, each named by what breaks when you ignore it. Here is each one with its tell-tale smell and its one-line fix.

- **S — Single Responsibility.** A class should have one reason to change. *Smell:* an `Invoice` class that calculates totals, prints itself, and emails itself. *Fix:* split printing and emailing into their own classes, leaving `Invoice` to just be an invoice.
- **O — Open/Closed.** Open for extension, closed for modification. *Smell:* every new discount type means editing a growing `if/else` chain inside the pricing code. *Fix:* make discount a pluggable interface — new type, new class, existing code untouched.
- **L — Liskov Substitution.** A subclass must be usable anywhere its parent is, without surprises. *Smell:* a `Square extends Rectangle` whose `setWidth` secretly also changes the height, breaking code that treats it as a rectangle. *Fix:* don't force the inheritance — model shapes by what they can do, not by what they resemble.
- **I — Interface Segregation.** Clients should not depend on methods they do not use. *Smell:* one giant `Worker` interface forcing a robot class to implement a pointless `eat()`. *Fix:* several small interfaces (`Workable`, `Feedable`) that classes pick from as needed.
- **D — Dependency Inversion.** High-level code should depend on abstractions, not concrete details. *Smell:* an `OrderService` that directly constructs a `MySQLDatabase` inside itself, so swapping databases means rewriting the service. *Fix:* depend on a `Database` interface and inject the concrete one from outside (dependency injection).

## OOP in JavaScript, Java & C++

The four pillars are language-independent; the mechanics differ. Java and C++ are class-based from birth: you write a class, it is compiled, and objects are created from it with `new`. JavaScript was originally **prototype-based**: objects inherit directly from other objects through a prototype chain; the `class` keyword (ES6) is friendly syntax layered on top of prototypes, not a new mechanism underneath.

```js
// JavaScript — class syntax, prototype underneath
class Counter {
  #count = 0;                       // # makes it truly private
  inc() { this.#count++; }
  value() { return this.#count; }
}
const c = new Counter();            // still built on a prototype chain
c.inc();
```

```cpp
// C++ — multiple inheritance allowed, manual control over copying
class Counter {
private:
    int count = 0;                  // private by label, not by symbol
public:
    void inc() { count++; }
    int value() const { return count; }
};
Counter c;                          // lives on the stack; no new needed
```

- **Java:** a class can extend exactly one class but implement many interfaces; fields hide behind `private` plus getters/setters; `final` prevents a class or method from being overridden.
- **C++:** a class may inherit from several parents (multiple inheritance), which is powerful and risky (the "diamond problem", solved with virtual inheritance when needed). Objects can live on the stack and are copied by value by default, so explicit copy rules matter.
- **JavaScript:** no true interfaces and no method overloading (a later definition simply replaces an earlier one); encapsulation by convention became real with `#private` fields; polymorphism is duck-typed — if the object has the method, the call works.

## Design basics — composition over inheritance

**Composition** means building a class out of other objects it *has*, instead of classes it *is*. A `Car` has an `Engine`, a `WheelSet`, a `GPS` — each a separate object with its own job, injected into the car. You combine behaviours by assembling pieces, and you may swap a piece at runtime (a racing engine today, an electric motor tomorrow) without rewriting the class hierarchy.

**Why prefer composition?** Inheritance shares everything and locks the relationship in at compile time; deep hierarchies become fragile — change a grandparent, break grandchildren in ways nobody predicted. Composition keeps units small, testable in isolation, and recombinable. Inheritance still has its place for genuine, stable "is-a" relationships (a `Dog` is an `Animal`), but the interview-ready rule is: *reach for composition first; inherit only when the is-a relationship is real and stable.*

Three patterns that appear everywhere, in plain words:

- **Singleton** — guarantee that only one instance of a class exists and give everyone a shared way to reach it. Used for configuration holders, connection pools, loggers. Easy to overuse; treat it as a managed global, and test code that secretly depends on it carefully.
- **Factory** — instead of calling `new` on concrete classes everywhere, you ask a factory method for "a payment method" and it decides which concrete class to build. Callers stay ignorant of the concrete types, so adding a new type means touching the factory, not a hundred call sites.
- **Observer** — one subject keeps a list of listeners and notifies them all whenever its state changes. Button clicks, event emitters, and pub/sub systems are observers in action: the subject never calls anyone by name; it just announces, and whoever subscribed responds.

## Interview questions

**1. What are the four pillars of OOP? Explain each in one line.**
> Encapsulation hides a class's data behind methods that enforce the rules. Abstraction exposes only a simple interface, so an interface can promise pay() without saying how. Inheritance lets a child class reuse and specialise a parent's behaviour along genuine is-a lines, and polymorphism lets the same method call behave according to the actual object, whether that is a dog barking or a cat meowing.

**2. Encapsulation vs abstraction — aren't they the same?**
> They are cousins, not twins. Encapsulation is about protection: bundle the data with its methods and keep the raw data private so rules cannot be bypassed. Abstraction is about simplification: present a clean, minimal interface and hide complexity behind it. A car's steering wheel is abstraction facing the driver, while the locked gearbox casing that stops you touching the gears is encapsulation.

**3. What is the difference between method overloading and overriding?**
> Overloading is same name, different parameters, decided at compile time — like having add(int, int) and add(double, double). Overriding is a child class replacing a parent's method with its own version, decided at runtime based on the actual object. People remember it as: overloading changes the signature, overriding changes the behaviour.

**4. Why prefer composition over inheritance?**
> Composition builds an object from parts it has, so I can swap an engine or a storage strategy at runtime and test each part alone. Inheritance locks in an is-a chain at compile time and couples child classes tightly to the parent's internals, so a change high in the hierarchy can break descendants quietly. Inheritance is genuinely right for stable is-a relationships, but composition is the safer default.

**5. Explain the SOLID principles briefly.**
> Single responsibility: one class, one reason to change. Open/closed: add behaviour by adding code, not editing existing code, usually via interfaces. Liskov substitution: a subclass must work anywhere its parent is used without surprises. Interface segregation: many small interfaces beat one fat interface clients must half-implement. Dependency inversion: depend on abstractions, and inject concrete implementations from outside.

**6. How does OOP work in JavaScript if it is prototype-based?**
> JavaScript objects inherit directly from other objects through a prototype chain — when a property is missing, the engine looks up the chain. The class keyword from ES6 is syntax on top of that machinery, not a replacement for it. So classes in JavaScript are still flexible and dynamic: I can add methods to prototypes at runtime, and truly private fields now exist with the hash prefix.

**7. Class-based vs prototype-based — name a practical difference.**
> In Java or C++, a class is compiled and fixed, and objects cannot gain new methods after creation. In JavaScript, objects are dynamic — I can add properties and methods at runtime, and objects can inherit straight from other objects without any class in between. I would also note the access difference: JavaScript makes privacy real with hash-prefixed fields, while Java and C++ use private access modifiers checked at compile time.

**8. What is a Singleton, and when is it useful?**
> A Singleton ensures exactly one instance of a class exists, with a single global way to access it. It fits things that are genuinely singular — application configuration, a database connection pool, a logger. The risk is that it behaves like a hidden global variable, which makes testing harder, so I use it deliberately rather than by default.

**9. Factory pattern — what problem does it solve?**
> It centralises object creation. Instead of every caller doing new on a concrete class and hard-coding which one, callers ask the factory for what they need by name or type. When a new type appears, I update the factory and one set of tests, instead of hunting down construction code spread across the application.

**10. What is the Observer pattern? Give a real example.**
> A subject maintains a list of observers and notifies them whenever its state changes; observers react independently. Every button click handler and event listener is this pattern. On the backend, an order service emitting "order placed" events so email, inventory, and analytics each react without the order service knowing they exist is exactly the same shape.

---
