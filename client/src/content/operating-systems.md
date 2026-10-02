# Operating Systems

Every app you have ever run — your browser, your music player, the Java program you wrote in college — runs because an operating system lets it share one machine with everything else. The OS is the program that sits between your code and the hardware, deciding who gets the CPU, who gets memory, and what happens when two programs want the same file at once. Interviewers ask about it because it explains the machine underneath all our code.

## Processes & threads — what actually runs

A **process** is a program that is loaded in memory and being run. Your source code sitting on disk is just a program; the moment you execute it, the OS creates a process: it gets its own address space (its private view of memory), its own open-files list, and its own identity (a PID). The OS keeps one bookkeeping structure per process called the **Process Control Block (PCB)** — think of it as the process's file in a filing cabinet. The PCB stores the process ID, the current state, the program counter (which instruction comes next), the CPU register values, memory limits, and the list of open files. Because the PCB holds everything needed to resume a process, the OS can pause one process and resume another without losing anything.

### Process states

A process moves through a small set of states during its life:

| State | What it means |
|---|---|
| **New** | The process is being created; the OS is still setting up its PCB and memory. |
| **Ready** | It has everything it needs and is sitting in the ready queue, waiting for its turn on the CPU. |
| **Running** | It is on the CPU right now, actually executing instructions. |
| **Waiting (Blocked)** | It asked for something slow — disk, network, keyboard — and is parked until that finishes. |
| **Terminated** | It finished (or was killed) and the OS is cleaning up after it. |

Moving from ready to running is a scheduling decision; moving from running to waiting happens when the process asks for I/O; when the I/O completes, the process goes back to ready, not straight to running — it must wait for its next CPU turn like everyone else.

### Threads — many hands inside one process

A **thread** is a single path of execution inside a process. Every process starts with one thread (the one that runs `main`), and it can create more. All threads of a process **share** the same address space, heap, global variables, and open files, but each thread keeps its own **stack** (its local variables and function calls) and its own registers and program counter.

- **Process vs thread:** A process is heavyweight — the OS must allocate a fresh address space and lots of bookkeeping. A thread is lightweight — creating one is mostly allocating a stack and a small control block, so it is far cheaper and faster. Switching between two threads of the same process is also cheaper than switching between processes, because the memory map does not change.
- **Why threads help:** A browser can render the page on one thread, download images on another, and listen to your clicks on a third. On a multi-core CPU these threads genuinely run in parallel; on one core the OS interleaves them so the program still feels responsive instead of freezing on the slowest task.
- **The catch:** Sharing is powerful and dangerous at the same time. If two threads write to the same variable at once, the result depends on timing — a race condition, covered in the synchronization chapter.

### Context switch — the cost of changing your mind

When the OS stops one process and starts another, it performs a **context switch**: it saves the outgoing process's registers and program counter into its PCB, then loads the incoming process's saved values from its PCB. While the switch is happening, the CPU does no useful work at all — it is pure overhead. The switch itself takes microseconds, but it makes the new process "cold": its data is not in the CPU cache anymore, so the first memory accesses are slow. This is why scheduling tries to balance fairness against switching too often.

## CPU scheduling — who gets the CPU next

With many more ready processes than CPU cores, the **scheduler** constantly answers one question: who runs next? A **preemptive** scheduler can forcibly take the CPU away (needed for interactivity); a **non-preemptive** one lets a process run until it blocks or finishes (simple, but a runaway process can starve everyone else). Good scheduling is a trade-off between response time (how fast the first byte of output appears), throughput (jobs finished per second), waiting time, and fairness — you cannot maximise all of them at once.

### The classic scheduling algorithms

| Algorithm | Idea | Preemptive? | Known problem |
|---|---|---|---|
| **FCFS** (First Come First Served) | Ready queue is a plain FIFO line. | No | Convoy effect — one long job makes everyone behind it wait. |
| **SJF** (Shortest Job First) | Always run the ready job that will finish fastest. | In its basic form, no | Provably minimal average waiting time, but the OS cannot truly know a job's future length; in the preemptive variant (SRTF) long jobs can starve forever. |
| **Round Robin (RR)** | Everyone gets a fixed time slice (a *quantum*), then goes to the back of the queue. | Yes | Very fair and responsive; performance depends entirely on choosing the quantum. |

**Round Robin quantum trade-off:** if the quantum is huge, RR degenerates into FCFS (each job just runs to completion). If it is tiny, the CPU spends a growing fraction of its time on context switches instead of real work. The classic "80% rule" says the quantum should be long enough that roughly 80% of jobs finish within a single slice.

### A small worked example — Round Robin

Processes arrive together at time 0 with these burst times (CPU time needed): P1 = 5, P2 = 3, P3 = 1. Quantum = 2.

| Time | Running | What happens |
|---|---|---|
| 0–2 | P1 | Uses its 2 units, 3 left, goes to the back of the queue. |
| 2–4 | P2 | Uses 2 units, 1 left, goes to the back. |
| 4–5 | P3 | Needs only 1 — finishes at time 5. |
| 5–7 | P1 | Second turn: 2 more units, 1 left. |
| 7–8 | P2 | Final unit — finishes at 8. |
| 8–9 | P1 | Final unit — finishes at 9. |

Completion times: P3 at 5, P2 at 8, P1 at 9. Notice how P3, the tiny job, did not wait for the big ones — that responsiveness is exactly why time-sharing systems (terminals, phones, desktops) use Round Robin.

## Synchronization & deadlocks

The moment two threads share data, ordering matters. A **critical section** is a piece of code that touches shared data and must not be executed by two threads at the same time. A **race condition** is a bug where the final result depends on the order threads happen to run, which changes from run to run.

### Mutex vs semaphore

- **Mutex (mutual exclusion lock):** a lock with an owner. One thread acquires it, runs the critical section, and must release it — like a bathroom key: only the person who took the key can return it. Use a mutex to protect a single shared resource or data structure.
- **Semaphore:** a counter guarded by two atomic operations, `wait` (decrement, block if zero) and `signal` (increment). A semaphore initialised to 1 behaves like a mutex, but a semaphore can also count: set it to 5 and up to five threads may enter (say, five database connections). Semaphores have no owner — any thread may signal — which makes them useful both for mutual exclusion and for ordering events ("thread B may proceed only after thread A signals").

### Deadlock — four conditions, all at once

A **deadlock** is a permanent traffic jam: each process holds a resource and waits for a resource another holds. Four conditions must hold *simultaneously* (the Coffman conditions), so breaking any one prevents deadlock:

1. **Mutual exclusion** — the resource can be held by only one process at a time.
2. **Hold and wait** — a process holds something while asking for more.
3. **No preemption** — resources can only be released voluntarily, never snatched away.
4. **Circular wait** — a cycle exists: P1 waits for P2's resource, P2 waits for P3's, P3 waits for P1's.

Classic prevention: force every process to acquire locks in one global order (kills circular wait) or to request all resources up front (kills hold-and-wait).

**Banker's algorithm** is the textbook *avoidance* idea: before granting a resource, the OS simulates "if I give this out, is there still some order in which every process could finish?" If yes, the state is *safe* and the grant is made; if not, the process waits even though the resource is free. It needs every process to declare its maximum needs in advance, which real programs rarely know — so real systems mostly prefer simpler rules (ordered locks, timeouts, watchdogs) and use banker's-style reasoning in a few controlled places like resource managers.

## Memory management — paging & segmentation

Programs believe they own a vast, private stretch of memory starting at address zero. The OS maintains that illusion. Inside, RAM is limited and shared, so the OS needs a scheme to place each process somewhere, protect processes from each other, and translate the addresses a program uses (**logical addresses**) into real RAM locations (**physical addresses**).

### Paging

**Paging** chops everything into fixed-size pieces. Physical RAM is divided into **frames**; a process's logical memory is divided into **pages** of the same size (commonly 4 KB). Pages can land in any free frames — no need for one big continuous hole, so external fragmentation disappears. A per-process **page table** records which frame each page lives in. Every logical address is really two numbers: a page number (index into the table) and an offset (position inside the page).

- **The cost:** Every memory access now needs two — one to read the page table, one to read the actual data. Caches to the rescue: the **Translation Lookaside Buffer (TLB)** is a small, fast hardware cache of recent page-to-frame translations. A TLB hit reduces translation to almost nothing; a miss means a page-table walk first. Locality (programs reuse nearby addresses) makes the TLB ridiculously effective in practice.
- **Segmentation** is the older alternative: memory is split into variable-sized segments matching the program's logical pieces (code, data, stack). It matches how programmers think, but variable sizes recreate external fragmentation — empty holes too small to use. Modern systems mostly use paging (sometimes with segmentation layered on top historically).

## Virtual memory & page replacement

**Virtual memory** extends the paging idea with a promise: pages do not need to be in RAM at all until they are touched. A page table entry can say "not present — it lives on disk in the swap area / page file". The first time a program touches such a page, the hardware raises a **page fault**: the OS pauses the process, loads the page from disk into a free frame, updates the page table, and restarts the faulting instruction as if nothing happened. Programs can therefore be larger than RAM, and more processes can share the machine — each keeps only its *hot* pages resident.

If RAM is full when a fault occurs, the OS must evict a victim page first. Writing a dirty victim back to disk before reusing its frame is why page faults are expensive — a fault costs thousands of times more than a normal memory access.

### Page replacement — FIFO vs LRU, worked

**FIFO** evicts the oldest-loaded page. Simple, but it can throw out a page that is used constantly, and it suffers from Bélády's anomaly (more frames can paradoxically cause *more* faults). **LRU (Least Recently Used)** evicts the page untouched for the longest time, betting that recent use predicts future use. LRU is not magic — it cannot be implemented perfectly without hardware help (access counters / timestamps), so real systems use approximations like the clock algorithm — but as a policy it captures locality far better than FIFO.

Reference string `7 0 1 2 0 3 0 4`, three frames:

| Reference | FIFO frames (oldest → newest) | Fault? | LRU frames (least → most recent) | Fault? |
|---|---|---|---|---|
| 7 | 7 | ✔ fault | 7 | ✔ fault |
| 0 | 7, 0 | ✔ fault | 7, 0 | ✔ fault |
| 1 | 7, 0, 1 | ✔ fault | 7, 0, 1 | ✔ fault |
| 2 | 0, 1, 2 (7 out) | ✔ fault | 0, 1, 2 (7 out) | ✔ fault |
| 0 | 0, 1, 2 (hit) | — | 1, 2, 0 (0 refreshed) | — |
| 3 | 1, 2, 3 (0 out) | ✔ fault | 2, 0, 3 (1 out) | ✔ fault |
| 0 | 1, 2, 3 → miss, 2, 3, 0 (1 out) | ✔ fault | 2, 3, 0 (hit) | — |
| 4 | 2, 3, 0 → miss, 3, 0, 4 (2 out) | ✔ fault | 3, 0, 4 (2 out) | ✔ fault |

FIFO takes **7 faults**; LRU takes **6**. Small difference here, but look at the mechanism: re-touching page 0 made FIFO still evict it (FIFO only watches arrival order), while LRU noticed the reuse and protected it. That is the whole lesson — policies that respect recency track real program behaviour.

### Thrashing

**Thrashing** is what happens when the system spends more time serving page faults than doing useful work. It usually starts when too many processes run at once: each steals frames from the others, everyone faults constantly, CPU utilisation collapses, and the OS's natural reflex — start even more processes — makes it worse. The cure is to reduce the degree of multiprogramming (suspend some processes and give the rest enough frames) or add RAM. Spotting thrashing in an interview answer means saying: the fix is fewer runnable processes, not a cleverer replacement policy.

## Interview questions

**1. What is the difference between a process and a thread?**
> A process is a running program with its own private memory and resources, while a thread is a single path of execution inside a process. Threads of the same process share the heap, globals, and files but each keeps its own stack and registers. That makes threads much cheaper to create and switch between, but it also means one bad thread can corrupt data shared by all of them.

**2. What is a context switch, and why is it considered overhead?**
> A context switch is when the OS saves the running process's registers and program counter into its PCB and loads another process's saved state so it can run. During the switch itself the CPU does no useful work at all, which makes it pure overhead. It also leaves the new process's data cold in the cache, so the first accesses afterwards are slower than usual.

**3. FCFS, SJF, and Round Robin — how do they differ?**
> FCFS simply runs jobs in arrival order, but one long job can make everyone else wait behind it, the convoy effect. SJF runs the shortest job next, which gives the lowest average waiting time, but the OS cannot truly know future job lengths. Round Robin gives every ready process a fixed time quantum in rotation, so it is fair and responsive — but if the quantum is too small, context-switch cost starts to dominate.

**4. Mutex vs semaphore — when do you use each?**
> A mutex is a one-owner lock: whichever thread acquires it must be the one to release it, and it protects a single critical section. A semaphore is a guarded counter with wait and signal operations, so it can let several threads in at once or order events between threads. I reach for a mutex to protect shared data and a counting semaphore to manage a pool of limited resources like database connections.

**5. What is a deadlock, and how do you prevent it?**
> A deadlock is when processes wait forever, each holding a resource another one needs. It needs four conditions at once: mutual exclusion, hold-and-wait, no preemption, and a circular wait. Because all four must hold together, preventing it is about breaking one — the most practical trick is making everyone acquire locks in the same global order, which destroys the possibility of a cycle.

**6. What is the banker's algorithm, in one breath?**
> It is a deadlock-avoidance scheme where the OS, before granting a resource, simulates whether every process could still finish in some order with what remains free. If that hypothetical state is safe, it grants; otherwise the process waits even though the resource is idle. It is elegant but rarely used directly because programs seldom know their maximum resource needs in advance.

**7. Explain paging and the role of the page table.**
> Paging divides physical memory into fixed-size frames and a process's logical memory into same-size pages, so a page can sit in any free frame and we avoid needing one continuous block. The page table maps each page to the frame holding it, and every address splits into a page number plus an offset inside the page. The TLB caches recent translations so this double lookup stays fast in practice.

**8. What happens during a page fault?**
> The program touches a page that is marked not-present, so the hardware traps into the OS. The OS finds a free frame — evicting and writing back a victim if memory is full — loads the needed page from disk, updates the page table, and restarts the instruction. Because disk is involved, a page fault is enormously more expensive than an ordinary memory access.

**9. FIFO vs LRU page replacement — which is better and why?**
> FIFO evicts the page that arrived first, ignoring whether it is still being used, and it can even suffer Bélády's anomaly. LRU evicts the page that has gone unused the longest, which matches how programs actually behave — recently used pages tend to be used again soon. LRU is harder to implement exactly, so real systems approximate it, but as a policy it consistently produces fewer faults.

**10. What is thrashing and how do you fix it?**
> Thrashing is when the system spends most of its time handling page faults instead of running programs, because processes keep stealing frames from each other. The usual trigger is too many processes competing for too little RAM. The fix is counterintuitive but simple — suspend some processes or add memory; a better replacement algorithm cannot save a system that is fundamentally over-committed.

---
