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

### Process vs thread — side by side

| Aspect | Process | Thread |
|---|---|---|
| Memory | Own private address space; cannot see another process's memory | Shares the process's heap and globals with sibling threads |
| What is private | Everything, by default | Only its stack, registers, and program counter |
| Creation cost | Heavy — new address space, bookkeeping, resource lists | Light — mostly a stack and a small control block |
| Communication | Must go through the OS (pipes, sockets, shared memory regions) | Just read and write shared variables — fast, and exactly why races happen |
| Crash impact | A crash is contained; other processes keep running | One thread corrupting shared memory or crashing usually takes the whole process down |
| Context switch | Expensive — memory map changes, caches and TLB go cold | Cheaper between threads of the same process; the memory map stays put |

A useful mental picture: a process is a house with its own locked doors, and threads are the people living inside it. People in the same house share the kitchen and can talk instantly, but they can also get in each other's way. People in different houses are safer from each other, but every conversation needs a trip outside.

Real systems mix both. A browser, for example, often gives each tab its own process (so one crashed tab cannot kill the rest) and runs several threads inside each tab (one to render, some to fetch, one to listen to you). You pay the process cost only where isolation matters, and you use threads everywhere inside where sharing is the point.

Two lifecycle leftovers interviewers like: a **zombie** process has finished, but its parent has not yet picked up its exit status, so a small PCB entry lingers in the table; an **orphan** process is still running but its parent has died, so the system adopts it (traditionally to PID 1) to make sure someone collects it at the end. Neither is running code — one is a finished record waiting to be collected, the other is healthy work with a new guardian.

> [!NOTE]
> Interview trap: "threads share everything" is wrong. Threads share the heap, globals, code, and open files — but each thread has its **own stack**. That is why local variables are naturally thread-private, and why two threads can be deep inside the same function without overwriting each other's locals.

### Context switch — the cost of changing your mind

When the OS stops one process and starts another, it performs a **context switch**: it saves the outgoing process's registers and program counter into its PCB, then loads the incoming process's saved values from its PCB. While the switch is happening, the CPU does no useful work at all — it is pure overhead. The switch itself takes microseconds, but it makes the new process "cold": its data is not in the CPU cache anymore, so the first memory accesses are slow. This is why scheduling tries to balance fairness against switching too often.

Step by step, a context switch looks like this: a timer interrupt (or an I/O request) stops the running process; the OS saves its registers, program counter, and stack pointer into its PCB; it updates the process state and moves it to the right queue; the scheduler picks whoever runs next; the OS restores that process's saved registers; and execution resumes exactly where that process left off, as if it had never been paused. The direct cost is those save/restore operations — microseconds of pure overhead. The indirect cost is usually bigger: the incoming process finds the CPU cache and TLB full of someone else's data, so its first stretch of memory accesses run at near-RAM speed instead of cache speed until it warms up again. Switch too eagerly and you get a machine that is technically "busy" all day while finishing very little real work.

How to keep the cost in proportion, the way you would say it out loud:

- A function call costs nanoseconds. A thread switch costs roughly a microsecond or so.
- A full process switch costs a few microseconds directly — plus the cold-cache tax afterwards, which is often the bigger bill.
- A page fault costs *milliseconds* of disk time. It dwarfs everything above it on this list.
- So: scheduling decisions argue about microseconds; memory decisions argue about milliseconds. Never optimise them as if they were the same currency.

## CPU scheduling — who gets the CPU next

With many more ready processes than CPU cores, the **scheduler** constantly answers one question: who runs next? A **preemptive** scheduler can forcibly take the CPU away (needed for interactivity); a **non-preemptive** one lets a process run until it blocks or finishes (simple, but a runaway process can starve everyone else). Good scheduling is a trade-off between response time (how fast the first byte of output appears), throughput (jobs finished per second), waiting time, and fairness — you cannot maximise all of them at once.

### The numbers schedulers are judged by

Four quantities show up in every scheduling problem, and interviewers love asking you to compute them by hand:

- **Burst time** — the CPU time a process actually needs to finish (given in the problem, guessed by the OS in real life).
- **Completion time (CT)** — the clock time at which the process finishes.
- **Turnaround time (TAT)** = completion time − arrival time. It measures the full journey: waiting plus running.
- **Waiting time (WT)** = turnaround time − burst time. This is the pure standing-in-line part — the time the process spent ready but not running.

Averages of waiting and turnaround time are how algorithms get compared. When you solve these on paper, draw the timeline (a Gantt chart) first and write down each finish time — almost every mistake in scheduling problems comes from skipping the picture and trying to do the arithmetic in your head.

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

Now the averages, using the definitions above (everyone arrived at 0, so turnaround = completion): turnaround times are P1 = 9, P2 = 8, P3 = 5, averaging **22/3 ≈ 7.33**. Waiting time is turnaround minus burst: P1 waited 9 − 5 = 4, P2 waited 8 − 3 = 5, P3 waited 5 − 1 = 4, averaging **13/3 ≈ 4.33**. Compare that shape with plain FCFS on the same jobs in the same arrival order: P1 finishes at 5, P2 at 8, P3 at 9 — average waiting time only 8/3 ≈ 2.67, but the one-unit job P3 sat idle for 8 full units before its single unit of work. That contrast is the honest summary of scheduling: Round Robin does not minimise averages; it buys responsiveness and fairness with them.

Same jobs, three algorithms, at a glance (all arrive at 0, order P1, P2, P3):

| Algorithm | Finish order | Avg waiting | Avg turnaround |
|---|---|---|---|
| FCFS | P1 (5), P2 (8), P3 (9) | 2.67 | 5.67 |
| SJF | P3 (1), P2 (4), P1 (9) | 1.33 | 4.33 |
| Round Robin (q=2) | P3 (5), P2 (8), P1 (9) | 4.33 | 7.33 |

SJF wins both averages, exactly as theory promises — the shortest jobs slip through first and barely wait. Round Robin looks worst on paper and feels best in your hands, because no job ever waits long for its *first* slice. Which column you optimise is a product decision before it is a math result: batch systems chase averages; anything a human is staring at chases response time.

> [!WARNING]
> Common scheduling traps: (1) In SJF problems, only jobs that have *already arrived* are candidates — do not pick a short job that has not shown up yet. (2) SRTF (preemptive SJF) re-decides at every arrival, not just at completions. (3) A process that goes off for I/O re-enters the *back* of the ready queue when it returns. (4) "Shortest job" in theory means shortest *next CPU burst*, which the OS can only estimate from past behaviour — saying "the OS cannot know this" out loud is usually the point the interviewer is fishing for.

**Starvation and priority:** pure SJF and strict priority scheduling share one disease — a steady stream of short or high-priority jobs can postpone a long or low-priority job forever. The standard cure is **aging**: the longer a job waits, the more its effective priority climbs, until it eventually wins a turn. When an interviewer asks "what is wrong with SJF in practice?", the two answers are "future burst times are unknowable" and "long jobs can starve — fix it with aging."

### How real schedulers combine these

No shipping OS runs textbook FCFS or SJF alone. Real schedulers are **multilevel feedback queues**: several ready queues at different priority levels, typically Round Robin at the top with short quanta and FCFS-like behaviour at the bottom. New and interactive jobs start high, where they get quick, short turns; a job that keeps burning its full quantum sinks a level (it has revealed itself as CPU-hungry), while a job that blocks early for I/O stays high. The feedback does SJF's job — favouring short, interactive work — without ever needing to know a burst time in advance: jobs sort themselves by how they behave. Windows, macOS, and classic Unix all rhyme with this design, and Linux's modern schedulers chase the same goals with fancier fairness accounting. If asked "which algorithm does a real OS use?", the honest shape of the answer is: a preemptive, priority-based scheduler with time slices and feedback that approximates shortest-job-first while protecting interactivity.

## Synchronization & deadlocks

The moment two threads share data, ordering matters. A **critical section** is a piece of code that touches shared data and must not be executed by two threads at the same time. A **race condition** is a bug where the final result depends on the order threads happen to run, which changes from run to run.

### A race condition you can hold in your head

Two threads each run `counter = counter + 1` one hundred times on a shared counter starting at 0. You expect 200. You often get less. Why? `counter + 1` is not one step — it is three: read the value, add one, write it back. If thread A reads 41 and thread B also reads 41 before A writes, both compute 42 and both write 42. Two increments just became one. Nothing crashed, no error was printed — the answer is simply, silently wrong, and it will be right again on the next run. That nondeterminism is what makes race conditions so nasty to debug: the bug hides whenever you look at it.

The fix is to make the read-add-write sequence **atomic** from the other threads' point of view: wrap it in a critical section so only one thread can be inside at a time. Everything below — mutexes, semaphores — is machinery for enforcing exactly that.

### Semaphores earning their keep — producer and consumer

The classic demonstration is a bounded buffer: one thread produces items into a small queue, another consumes them. Two counting semaphores run the whole show. `emptySlots` starts at the buffer size: the producer waits on it before adding (no free slot, no producing). `filledSlots` starts at 0: the consumer waits on it before taking (nothing there, no consuming). Each side signals the other's semaphore as it works. Add one mutex around the actual queue manipulation, and the two threads can never overfill, never underflow, and never corrupt the queue — with no polling and no wasted spinning. Whenever an interview problem says "limited slots" or "wait until something is ready", this pair-of-semaphores shape is almost certainly the expected answer.

### Mutex vs semaphore

- **Mutex (mutual exclusion lock):** a lock with an owner. One thread acquires it, runs the critical section, and must release it — like a bathroom key: only the person who took the key can return it. Use a mutex to protect a single shared resource or data structure.
- **Semaphore:** a counter guarded by two atomic operations, `wait` (decrement, block if zero) and `signal` (increment). A semaphore initialised to 1 behaves like a mutex, but a semaphore can also count: set it to 5 and up to five threads may enter (say, five database connections). Semaphores have no owner — any thread may signal — which makes them useful both for mutual exclusion and for ordering events ("thread B may proceed only after thread A signals").

| Aspect | Mutex | Semaphore |
|---|---|---|
| What it is | A lock with an owner | A counter with two atomic operations |
| Who releases it | Only the thread that locked it | Any thread may signal |
| How many inside | Exactly one at a time | Up to the initial count |
| Typical job | "Only one thread touches this data" | "Only N threads at once", or "B goes after A" |
| Plain-words version | A key that must be returned by whoever took it | A tray of tokens: take one to enter, put one back when you leave |

The sentence that unlocks most interview answers: *a mutex protects, a semaphore counts and signals.* If the question mentions a pool (connections, printers, seats), it wants a counting semaphore. If it mentions one shared variable, it wants a mutex.

### Deadlock — four conditions, all at once

A **deadlock** is a permanent traffic jam: each process holds a resource and waits for a resource another holds. Four conditions must hold *simultaneously* (the Coffman conditions), so breaking any one prevents deadlock:

1. **Mutual exclusion** — the resource can be held by only one process at a time.
2. **Hold and wait** — a process holds something while asking for more.
3. **No preemption** — resources can only be released voluntarily, never snatched away.
4. **Circular wait** — a cycle exists: P1 waits for P2's resource, P2 waits for P3's, P3 waits for P1's.

Classic prevention: force every process to acquire locks in one global order (kills circular wait) or to request all resources up front (kills hold-and-wait).

**A deadlock in slow motion:** thread A locks the database, then asks for the printer. Thread B locks the printer, then asks for the database. A holds the database and waits forever for the printer; B holds the printer and waits forever for the database. Nobody made a coding *mistake* exactly — each thread was reasonable on its own. The system froze because the two acquisition orders crossed. Notice that all four Coffman conditions are visibly present, and notice how mundane the fix is: agree that everyone locks the database before the printer, always, and this exact freeze becomes impossible.

Four strategies, so you can name which family a fix belongs to: **prevention** designs the system so one condition can never occur (lock ordering, all-at-once requests); **avoidance** checks each grant before making it (banker's algorithm, below); **detection and recovery** lets it happen, notices the cycle in the wait-for graph, and kills or rolls back a process; **ignoring it** is honestly what most general-purpose systems do — the famous "ostrich algorithm" — because deadlocks in practice are rare and prevention is costly, so the system relies on timeouts, restarts, and careful coding instead.

Mistakes that create these bugs in real code, so you can spot them in review:

- Locking in **different orders in different functions** — the single most common deadlock recipe.
- Calling unknown code (callbacks, user handlers) **while holding a lock** — you just handed your lock ordering to a stranger.
- Locking the **same non-reentrant mutex twice** in one thread — a deadlock with yourself, no second thread required.
- Forgetting that an early `return` or an exception **skips the unlock** — which is why scoped lock guards and `try/finally` exist.
- Holding a lock across **slow I/O** — not a deadlock, but everyone else now waits on your disk.

> [!NOTE]
> Deadlock is not the same as starvation. In deadlock, nobody can *ever* proceed. In starvation, a process waits a very long time but the system as a whole keeps moving — and the fix is fairness (queues, aging), not breaking cycles. Interviewers swap these two deliberately to see if you notice.

**Banker's algorithm** is the textbook *avoidance* idea: before granting a resource, the OS simulates "if I give this out, is there still some order in which every process could finish?" If yes, the state is *safe* and the grant is made; if not, the process waits even though the resource is free. It needs every process to declare its maximum needs in advance, which real programs rarely know — so real systems mostly prefer simpler rules (ordered locks, timeouts, watchdogs) and use banker's-style reasoning in a few controlled places like resource managers.

## Memory management — paging & segmentation

Programs believe they own a vast, private stretch of memory starting at address zero. The OS maintains that illusion. Inside, RAM is limited and shared, so the OS needs a scheme to place each process somewhere, protect processes from each other, and translate the addresses a program uses (**logical addresses**) into real RAM locations (**physical addresses**).

### Paging

**Paging** chops everything into fixed-size pieces. Physical RAM is divided into **frames**; a process's logical memory is divided into **pages** of the same size (commonly 4 KB). Pages can land in any free frames — no need for one big continuous hole, so external fragmentation disappears. A per-process **page table** records which frame each page lives in. Every logical address is really two numbers: a page number (index into the table) and an offset (position inside the page).

- **The cost:** Every memory access now needs two — one to read the page table, one to read the actual data. Caches to the rescue: the **Translation Lookaside Buffer (TLB)** is a small, fast hardware cache of recent page-to-frame translations. A TLB hit reduces translation to almost nothing; a miss means a page-table walk first. Locality (programs reuse nearby addresses) makes the TLB ridiculously effective in practice.
- **Segmentation** is the older alternative: memory is split into variable-sized segments matching the program's logical pieces (code, data, stack). It matches how programmers think, but variable sizes recreate external fragmentation — empty holes too small to use. Modern systems mostly use paging (sometimes with segmentation layered on top historically).

### Why paging at all?

Early systems loaded each program into one continuous stretch of RAM. That sounds simple until you live with it: programs end, new ones arrive, and memory ends up like a parking lot with a hundred free single spaces but nowhere to park one bus. That leftover waste between blocks is **external fragmentation**, and fixing it meant stopping the world and shuffling programs around. Paging deletes the problem by deleting the requirement: if every piece is the same fixed size and any page can live in any frame, then *any* free frame can satisfy *any* request. There is no "hole too small to use" because there are no variable holes at all.

The one waste paging keeps is **internal fragmentation**: a process whose memory does not fill its last page exactly leaves the tail of that page unused. With 4 KB pages the average waste is about half a page per process — a known, bounded price, paid in exchange for killing external fragmentation completely. Keep the two straight in interviews: *segmentation suffers external, paging suffers internal.*

### One address translation, step by step

Say pages are 4 KB (so the offset is the last 12 bits of the address) and a program reads logical address whose page number is 3:

1. The CPU splits the address into **page 3** plus an **offset** within that page.
2. It checks the TLB for page 3. On a **hit**, it already knows the frame — say frame 17 — and combines frame 17 with the offset to form the physical address. Done, at close to full speed.
3. On a TLB **miss**, the hardware walks the page table in memory: entry 3 says which frame holds this page (and whether it is present, writable, and so on). That frame number goes into the TLB, so the next access to this page is a hit.
4. If the page-table entry says **not present**, there is no frame at all — this is a page fault, and the virtual-memory machinery (next section) takes over before the read can complete.

Worked numbers, so it stops being abstract. Take a 16-bit machine with 4 KB pages. A logical address is 16 bits: the top 4 bits name the page (16 possible pages), the low 12 bits are the offset. The program asks for page 5, offset 200. The page table says page 5 currently lives in frame 9. The physical address is therefore frame 9's starting byte (9 × 4096) plus 200 — same offset, different neighbourhood. Nothing about the offset ever changes during translation; only the page number is swapped for a frame number. That one sentence — *the page table swaps the page number for a frame number and leaves the offset alone* — answers a surprising number of exam and interview questions on its own.

Each page-table entry carries more than a frame number: a **present/valid bit** (is it in RAM?), **protection bits** (may this process read, write, execute it?), a **dirty bit** (has it been written — must it be saved before eviction?), and a **referenced bit** (touched recently — gold for the replacement policy). Most "how does the OS know X?" questions about memory are answered by one of these bits.

### The TLB in plain words

The Translation Lookaside Buffer is just a tiny, very fast notebook the CPU keeps: "last time you asked, page 3 was in frame 17." It works because programs have **locality** — they run the same loops, touch the same arrays, and live inside a small neighbourhood of addresses for long stretches. So a few dozen remembered translations cover the overwhelming majority of accesses, and the two-step page-table walk becomes the rare exception instead of the rule. When a TLB miss *does* happen, nothing is broken — you simply pay one extra memory read to consult the page table, then carry on.

### Paging vs segmentation

| Aspect | Paging | Segmentation |
|---|---|---|
| Piece size | Fixed (e.g. 4 KB pages and frames) | Variable, matching logical pieces (code, data, stack) |
| What the programmer sees | One flat stretch of memory; pages are invisible | Visible segments that mirror the program's structure |
| Address is | Page number + offset | Segment number + offset |
| Fragmentation | Internal (tail of the last page) | External (unusable holes between segments) |
| Sharing/protection | Per page; a shared page is easy | Per segment; natural for "share the code segment" |
| Where it won | Modern general-purpose systems | Mostly historical; ideas survive inside paging systems |

## Virtual memory & page replacement

**Virtual memory** extends the paging idea with a promise: pages do not need to be in RAM at all until they are touched. A page table entry can say "not present — it lives on disk in the swap area / page file". The first time a program touches such a page, the hardware raises a **page fault**: the OS pauses the process, loads the page from disk into a free frame, updates the page table, and restarts the faulting instruction as if nothing happened. Programs can therefore be larger than RAM, and more processes can share the machine — each keeps only its *hot* pages resident.

If RAM is full when a fault occurs, the OS must evict a victim page first. Writing a dirty victim back to disk before reusing its frame is why page faults are expensive — a fault costs thousands of times more than a normal memory access.

This loading-on-first-touch behaviour is called **demand paging**: nothing is loaded "just in case"; every page earns its place in RAM by being requested. A freshly started program faults a lot at first, then settles as its working set arrives. That settle-down curve is exactly what you feel when an app is sluggish for its first seconds and then suddenly smooth.

The set of pages a process is actively using over a window of time is its **working set**. The whole of virtual memory rests on one bet: at any moment, a process needs only a small working set, not its entire address space. Keep every running process's working set in RAM and faults stay rare and cheap-ish. Let working sets overlap and starve each other, and you slide towards thrashing, below.

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

Two reference points complete the picture. **OPT (optimal)** evicts the page whose next use is furthest in the future; it is unbeatable and unimplementable, because it needs tomorrow's reference string today — it exists as the yardstick every real policy is measured against. And true LRU needs a timestamp or counter updated on *every* memory access, which hardware cannot afford at full speed, so real systems approximate it: the **clock algorithm** gives each page a referenced bit, sweeps like a clock hand clearing bits, and evicts the first page whose bit is already 0 — "not used in the last sweep" standing in for "not used recently". When an interviewer asks "how is LRU actually implemented?", *it isn't — it is approximated, usually with clock* is the answer that lands.

> [!WARNING]
> Bélády's anomaly traps people: with FIFO, giving a process *more* frames can produce *more* faults on some reference strings. It feels impossible until you remember FIFO evicts by arrival order only, so a bigger memory can hold on to stale pages longer and still drop the hot one. LRU never does this — it belongs to the "stack algorithms" family where more frames can only help.

### Thrashing

**Thrashing** is what happens when the system spends more time serving page faults than doing useful work. It usually starts when too many processes run at once: each steals frames from the others, everyone faults constantly, CPU utilisation collapses, and the OS's natural reflex — start even more processes — makes it worse. The cure is to reduce the degree of multiprogramming (suspend some processes and give the rest enough frames) or add RAM. Spotting thrashing in an interview answer means saying: the fix is fewer runnable processes, not a cleverer replacement policy.

You can watch it develop in stages: each new process takes frames from the others, so everyone's fault rate climbs; the CPU sits idle waiting on disk, which *looks* like spare capacity; a naive controller admits yet more processes to "use" that capacity, and the fault rate climbs again. The diagnostic signature is high disk activity, low CPU usage, and a system that gets *slower* as you add work. The working-set view explains the cure directly: the machine is healthy only while the sum of all working sets fits in RAM. Suspend the lowest-priority processes whole (their frames go to the survivors), or add memory — those are the only two honest fixes, and naming **swap death** on modern Linux boxes (the whole desktop crawling while `kswapd` burns CPU) is the same phenomenon wearing a newer name.

The one-paragraph version of this whole chapter: processes are isolated programs, threads are shared-memory paths inside them; the scheduler shares the CPU with preemption and time slices, judging itself on waiting and turnaround time; shared data demands critical sections guarded by mutexes and semaphores, and deadlocks need four conditions that good lock ordering breaks; paging gives every process a private illusion of memory through page tables and the TLB, and virtual memory keeps only the working set in RAM, replacing pages by recency — until too many working sets fight over too few frames and the machine thrashes. If you can say that paragraph calmly, the interview answers that follow are just it, unfolded.

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
