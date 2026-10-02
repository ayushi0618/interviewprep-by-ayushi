# Computer Networks

Every time you open a website, two computers that have never met negotiate a conversation across cables, Wi-Fi, and a chain of strangers' routers — and it just works. Computer networks is the study of how that conversation is organised. Interviewers rarely want the whole textbook; they want to see whether you know which layer does which job, why TCP and UDP both exist, and what actually happens between typing a URL and seeing a page.

## OSI & TCP/IP — the layered map

Networks are built as **layers**: each layer offers a service to the one above it and hides the mess below. When your laptop sends data, it travels *down* the stack on your side (each layer adds its own header — **encapsulation**), crosses the wire, and travels *up* the stack on the other side. Two models describe the same machine.

| OSI layer | What it does (plain words) | TCP/IP equivalent | Examples |
|---|---|---|---|
| Application | What the user wants: fetch a page, send mail | Application | HTTP, SMTP, DNS |
| Presentation | Format and encryption of the data (merged into Application in TCP/IP) | — (folded into Application) | TLS, encoding |
| Session | Open, manage, close a conversation (also folded in) | — (folded into Application) | — |
| **Transport** | End-to-end delivery between two programs; ports live here | Transport | **TCP, UDP** |
| **Network** | Moving packets between different networks; IP addresses and routing live here | Internet | **IP**, routers |
| Data Link | One hop between neighbours on the same link; MAC addresses live here | Network Access | Ethernet, Wi-Fi |
| Physical | Actual bits over cable, air, or fibre | (part of Network Access) | Cables, radio |

The OSI model has seven layers and is the teaching map; the TCP/IP model has four and is the one the real Internet implements — its Application layer swallows OSI's top three. The layer question interviewers love: **switches work at the data-link layer (MAC addresses), routers at the network layer (IP addresses).**

### Why layers exist at all

Imagine designing the whole Internet as one giant program. If the cable technology changed, you would have to rewrite everything. Layers prevent that. Each layer promises a small, clear job to the layer above it:

- The physical and data-link layers promise: "I can get bits to the next machine on this link."
- The network layer promises: "I can get a packet across many links, towards the right network."
- The transport layer promises: "I can get data to the right program on the far computer, as reliably as you asked."
- The application layer promises: "I can express what the user actually wants — a page, a message, a file."

Because each promise is narrow, you can swap the technology underneath without touching the rest. Your browser does not know or care whether the last hop was Wi-Fi, 5G, or a cable — that is a lower-layer detail. This is the same reason a new transport idea can be tested without rebuilding the cables of the world.

A useful mental picture is posting a letter. You write the letter (application), put it in an envelope with a name (transport), add the full postal address (network), hand it to the local post van (data link), and the van drives on actual roads (physical). At the far end, each envelope is opened in reverse order. Networks do the same thing, just thousands of times per second.

### Encapsulation — each layer adds its own envelope

As data travels down the stack, every layer wraps it in its own header. Interviewers often ask for the names of the wrapped unit at each layer, so learn this chain:

| Layer | Unit name | What the header mainly carries |
|---|---|---|
| Application | Message / data | The request or response itself, like an HTTP GET |
| Transport | Segment (TCP) or datagram (UDP) | Source and destination ports, sequence numbers for TCP |
| Network | Packet | Source and destination IP addresses |
| Data Link | Frame | Source and destination MAC addresses for the next hop |
| Physical | Bits | The frame turned into signals on the wire or in the air |

On the receiving side, each layer reads only its own header, does its job, removes that header, and passes the rest upward. This is called **decapsulation**. The important consequence: each layer talks to its *peer* layer on the other machine, even though the data physically travelled down, across, and up. The two transport layers behave as if they have a direct conversation; the two network layers behave as if they are neighbours. That illusion is the whole point of layering.

### A packet's journey, layer by layer

Follow one small thing: your laptop loading `https://example.com` over home Wi-Fi.

1. **Application:** Your browser builds an HTTP request: "GET / HTTP/1.1, Host: example.com."
2. **Transport:** TCP adds a header with the source port (a temporary number your OS picked, say 51234) and the destination port 443, plus a sequence number so the bytes can be reassembled in order.
3. **Network:** IP adds a header: source `192.168.1.10` (your laptop at home), destination `93.184.216.34` (the server you found through DNS).
4. **Data Link:** Wi-Fi wraps it in a frame addressed to your router's MAC address — because the *next hop* is the router, not the far server. This is a point freshers often miss: the MAC address changes at every hop, while the IP addresses stay the same end to end (unless NAT rewrites them — more on that later).
5. **Physical:** The Wi-Fi radio turns the frame into radio waves.

Your router receives the frame, strips the data-link header, reads the IP packet, decides the next hop towards `93.184.216.34`, and creates a *brand new frame* suitable for its outgoing link. Routers repeat this — read the network layer, rewrap at the data-link layer — until the packet reaches the server's network. The server then unwraps everything in reverse and the HTTP request finally reaches the web server program waiting on port 443.

> [!NOTE]
> Quick trap check: a switch never looks at IP addresses and a router never forwards by MAC address across networks. If an answer mixes these up, interviewers notice immediately.

**Common mistakes / interview traps**

- Saying "the packet goes to the server's MAC address." Only the next hop's MAC is ever used.
- Listing OSI layers top-to-bottom but not being able to say *what each one is for*. Always attach a job and an example to each name.
- Confusing ports with IP addresses. The IP gets the packet to the right *machine*; the port gets it to the right *program* on that machine.
- Claiming TCP/IP has seven layers. It has four — OSI is the seven-layer model.

## TCP vs UDP — reliability vs speed

Both live at the transport layer and ride on top of IP, which itself promises nothing — packets may be lost, duplicated, or arrive out of order. The transport layer decides how much to fix.

**TCP (Transmission Control Protocol)** is connection-oriented and perfectionist. Before any data moves, the two ends perform a **three-way handshake**: the client sends `SYN` ("shall we talk?"), the server replies `SYN-ACK` ("yes, and here's my starting number"), the client finishes with `ACK` ("got it"). Every byte afterwards is numbered; the receiver acknowledges what arrived; anything unacknowledged gets resent; the receiver reassembles the stream in order before handing it to the application. Closing is also polite: each side sends `FIN`, the other replies `ACK`, so both directions shut down cleanly.

**UDP (User Datagram Protocol)** is the opposite philosophy: no handshake, no acknowledgements, no reordering — just addressed packets fired at the destination. Nothing is guaranteed, but nothing is waited on either.

| | TCP | UDP |
|---|---|---|
| Connection | Yes — handshake before data, teardown after | None — just send |
| Reliability | Guaranteed, in-order delivery with retransmission | Best-effort; loss and reordering possible |
| Overhead/speed | Heavier headers, acknowledgements, congestion control | Tiny header, minimal delay |
| Choose it when | A file, page, or email must arrive byte-perfect | A late packet is worthless anyway — live video, voice calls, online games; also DNS lookups, where a tiny question fits one packet and the application can simply retry |

The classic example: downloading a file over UDP could silently corrupt it, while running a live call over TCP would stall the whole conversation waiting to retransmit a frame that is already too old to display.

### The three-way handshake, step by step

The handshake does two jobs at once: it checks that both sides are really there and willing to talk, and it synchronises the starting **sequence numbers** that everything later depends on.

1. **SYN:** The client picks a random starting number, say `x = 1000`, and sends it with the SYN flag: "I want to talk, and my bytes will be numbered from 1000."
2. **SYN-ACK:** The server replies with its own starting number, say `y = 5000`, and an acknowledgement of `1001` — meaning "I received your 1000, I expect 1001 next." One packet carries both the server's SYN and the ACK of the client's SYN, which is why three packets suffice instead of four.
3. **ACK:** The client acknowledges the server's number (`5001` expected next). The connection is open and data can flow — the client may even attach the first data to this final packet.

Why random starting numbers? So that delayed packets from an *old*, dead connection between the same two machines cannot be mistaken for part of the new one. It is a small detail that shows real understanding when you mention it.

### Teardown — saying goodbye properly

Closing is a four-step exchange, because each direction closes independently:

1. One side (say the client) sends `FIN`: "I have no more data to send."
2. The server replies `ACK`. The server may still have data in flight, so the connection is now *half-closed*.
3. When the server is also done, it sends its own `FIN`.
4. The client replies `ACK` and waits a short while (the TIME_WAIT state) in case that final ACK was lost and the server repeats its FIN.

This is why "connection closed" errors and lingering half-open connections exist in real systems: teardown is a polite negotiation, and sometimes one side simply vanishes — the Wi-Fi drops, the laptop lid closes — leaving the other side to notice by timeout.

### How TCP creates reliability on top of unreliable IP

Interviewers often push one level deeper: "IP loses packets. So how does TCP actually fix that?" Four mechanisms do the work:

- **Sequence numbers:** Every byte is numbered, so the receiver can spot gaps, duplicates, and out-of-order arrivals.
- **Acknowledgements (ACKs):** The receiver keeps reporting "I have everything up to byte N," so the sender knows exactly what landed.
- **Retransmission:** If an ACK does not arrive in time, the sender assumes the segment was lost and sends it again. The timeout adapts to measured round-trip time — fast networks resend quickly, slow ones wait longer instead of panicking.
- **Flow and congestion control:** The receiver advertises a *window* — "you may send this much before I acknowledge" — so a fast sender cannot drown a slow receiver. Separately, TCP watches for loss as a sign of a congested network and slows down, then cautiously speeds back up. This politeness is a big reason the Internet does not collapse under its own traffic.

Strip any one of these away and the guarantee falls apart — which is exactly the design space UDP chooses to live in.

### When UDP actually wins — real examples

UDP is not "the bad protocol." It is the right tool whenever *freshness beats completeness*, or when the conversation is so small that TCP's setup would cost more than the data itself:

- **Live voice and video calls (Zoom, Google Meet):** If a packet carrying 20 milliseconds of your voice is lost, replaying it half a second later is useless — the conversation has moved on. The app conceals the tiny gap and keeps going. TCP would freeze everything while it retransmits stale audio.
- **Online games:** The game needs your position *now*, many times per second. A lost update is instantly replaced by the next one. Games layer on only the reliability they truly need — for example, reliable delivery for "the player bought an item," fire-and-forget for "the player is at coordinates (x, y)."
- **DNS lookups:** One tiny question, one tiny answer. Building a whole TCP connection to ask "what is the IP of example.com?" would triple the work; if the answer never comes, the application just asks again.
- **Live streaming and broadcasts:** One sender, potentially millions of receivers. TCP's per-viewer connection and retransmissions do not scale to true broadcast; UDP (often with forward error correction added by the app) does.

The pattern to say out loud: *with UDP, reliability is not forbidden — it is moved into the application, which adds exactly the checks it needs and skips the rest.*

**Common mistakes / interview traps**

- "UDP is faster because it has fewer features." True but incomplete — say *why*: no handshake round trip, no waiting for retransmissions, no congestion-control slowdowns, smaller headers.
- "TCP is always the safer default." For live media, TCP's reliability actively makes things worse — a late retransmission is wasted work that delays everything behind it.
- Forgetting that ports belong to the transport layer. "Which port does HTTPS use?" (443) is a transport-layer question.
- Claiming UDP has *no* error detection at all. It carries a checksum; it simply does not retransmit or reorder when something fails.

## HTTP/HTTPS — the web's conversation

HTTP is the application-layer protocol browsers and servers speak. It is **request–response** and **stateless**: every request carries everything needed to understand it, and the server remembers nothing between requests (cookies and tokens bolt memory on top).

**The methods say what you mean:** `GET` reads a resource and must not change anything; `POST` creates something or submits data; `PUT` replaces a resource completely; `PATCH` changes part of it; `DELETE` removes it. **Status codes say how it went:** `2xx` success (200 OK, 201 Created), `3xx` redirection (301 Moved Permanently, 304 Not Modified — "your cached copy is still good"), `4xx` client's fault (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found), `5xx` server's fault (500 Internal Server Error).

A single page load is actually dozens of these conversations: one for the HTML, then the browser reads it and fires parallel requests for CSS, JavaScript, images, and API calls — all over connections that HTTP/1.1 keeps open (keep-alive) and HTTP/2 multiplexes over a single connection so they don't queue behind each other.

### One HTTP conversation, taken apart

Here is a real exchange in plain text — this is literally what travels inside the TCP connection (or inside the TLS tunnel, for HTTPS):

```
GET /products?id=42 HTTP/1.1
Host: shop.example.com
Accept: application/json
```

The first line is the **request line**: method (`GET`), the path including any query string (`/products?id=42`), and the protocol version. The lines after it are **headers** — `Host` names the website (essential, because one server IP may host many sites), `Accept` says what formats the client can handle. A blank line ends the head; for a `POST`, the data (the **body**) follows.

The server replies in mirror image:

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 58

{"id": 42, "name": "Notebook", "price": 499}
```

A **status line** first, then response headers describing what follows, a blank line, then the body itself. Notice how *everything needed is inside these two messages* — that is what stateless means in practice. The server did not need to remember you; your request carried the product id, and if you were logged in, your cookie or token travelled as just another header.

### Methods, safety, and idempotency — the follow-up question

Interviewers love pressing here, because it separates people who have only *used* APIs from people who can *design* them:

| Method | Job | Safe? (changes nothing) | Idempotent? (same result if repeated) |
|---|---|---|---|
| GET | Read a resource | Yes | Yes |
| POST | Create or submit | No | No — two POSTs create two orders |
| PUT | Replace a resource fully | No | Yes — replacing twice with the same data ends in the same state |
| PATCH | Change part of a resource | No | Not guaranteed — depends on how the patch is written |
| DELETE | Remove a resource | No | Yes — deleting an already-deleted resource changes nothing further |

A concrete scenario: your payment request times out and you retry it. If the API was built on `PUT /users/42` with full data, the retry is harmless — the end state is identical. If it was a `POST /orders`, a naive retry creates a *second* order and charges the customer twice. This is why real payment APIs add idempotency keys — but the interview point is simpler: know which methods are safe to retry and why.

### Status codes as a story

Do not memorise fifty codes; memorise the *story each family tells*, plus the famous members:

- **2xx — "It worked."** `200 OK` (here is your data), `201 Created` (a new resource was made — the natural reply to a successful POST), `204 No Content` (done, and there is nothing to show you).
- **3xx — "Look elsewhere."** `301 Moved Permanently` (update your bookmarks), `302 Found` (temporary move), `304 Not Modified` (your cached copy is still valid — saves bandwidth on every reload).
- **4xx — "You asked wrong."** `400 Bad Request` (malformed input), `401 Unauthorized` (you are not logged in — badly named, it means *unauthenticated*), `403 Forbidden` (we know who you are, and you are still not allowed), `404 Not Found`, `429 Too Many Requests` (slow down).
- **5xx — "We broke."** `500 Internal Server Error` (the server's code failed), `502 Bad Gateway` / `503 Service Unavailable` (a server in front is up, but the one behind it is down or overloaded).

The 401-versus-403 distinction is a classic trap. 401 says "prove who you are"; 403 says "identity confirmed, permission denied." Mixing them up in an answer is forgiven; mixing them up in an API leaks confusing signals to every client.

### HTTP/1.1, HTTP/2, and HTTP/3 in one breath

- **HTTP/1.1** introduced keep-alive (reuse one TCP connection for many requests instead of reconnecting each time), but requests on that connection are still answered one at a time — a slow request blocks the ones behind it (*head-of-line blocking*).
- **HTTP/2** keeps the same methods and status codes but sends data in binary frames and **multiplexes**: many requests share one connection and their responses interleave, so one slow image no longer queues the whole page. It also compresses headers.
- **HTTP/3** goes further and replaces TCP with QUIC, which is built on UDP. That removes even TCP-level head-of-line blocking (one lost packet no longer stalls every stream) and makes connection setup faster.

For a fresher interview, the one-liner is enough: *the semantics never changed — only how efficiently the bytes move underneath.*

### HTTPS: HTTP with a locked tunnel

HTTPS is HTTP carried inside **TLS** encryption. The TLS handshake, in plain words: after TCP connects, the browser and server agree on encryption settings; the server presents a **certificate** — a signed ID card from a trusted Certificate Authority proving "I really am this domain"; both sides use **asymmetric cryptography** (slow but needs no pre-shared secret) just long enough to safely agree on a fresh **symmetric session key**; from then on, everything travels encrypted with that fast symmetric key, and each message carries a tamper check. You get three things: confidentiality (nobody in the middle can read it), integrity (nobody can silently change it), and authentication (you really are talking to your bank, not an impostor).

### The TLS handshake, step by step

1. **TCP first:** TLS sits on top of a normal TCP connection, so the three-way handshake happens before any of this.
2. **ClientHello:** The browser says hello and lists what it supports — TLS versions, cipher suites (encryption algorithms it knows), and a random number used later in key-building.
3. **ServerHello + certificate:** The server picks the settings, sends its own random number, and presents its certificate — the domain name plus the server's public key, signed by a Certificate Authority.
4. **Verification:** The browser checks the certificate: Was it signed by an authority in its trust store? Is it expired? Does the domain on the certificate match the site in the address bar? Fail any check and you get the famous full-page warning.
5. **Key agreement:** Using asymmetric cryptography (in modern TLS, a Diffie–Hellman-style exchange), both sides combine the random numbers and the key material to independently arrive at the *same* fresh session key — without that key ever travelling across the wire in readable form.
6. **Finished:** Both sides switch to the fast symmetric key and confirm the handshake itself was not tampered with. From this point, HTTP requests and responses travel as encrypted, tamper-checked records.

Two "why" questions interviewers ask next:

- **Why use both asymmetric and symmetric encryption?** Because asymmetric solves the introduction problem (agreeing on a secret with a stranger, over a wire everyone can watch) but is slow; symmetric is fast but needs a shared secret first. TLS uses each where it shines.
- **Why does the certificate matter if the data is encrypted anyway?** Encryption to a stranger is worthless — you might be having a perfectly private conversation with the attacker. The certificate is what proves the other end is really your bank. That interception setup, where an attacker sits in the middle relaying both sides, is the **man-in-the-middle attack** HTTPS is designed to defeat.

**Common mistakes / interview traps**

- "HTTPS encrypts the URL." The domain is visible (DNS and the connection reveal it); what is encrypted is the path, query, headers, and body inside the tunnel.
- "GET parameters are hidden in HTTPS but visible in the body." Inside TLS, *everything* after the domain is encrypted — URL path included. Outside TLS (plain HTTP), everything is visible.
- Saying a 404 is a server error. It is a 4xx — the client asked for something that does not exist. Server errors are 5xx.
- Claiming HTTP is stateful because websites remember your login. The remembering is bolted on with cookies/tokens resent on every request; the protocol itself remembers nothing.

## DNS — how names become addresses

Humans remember `example.com`; machines route to `93.184.216.34`. The **Domain Name System** converts between the two, and it is itself one of the world's largest distributed databases.

**Resolution, step by step:**

1. Your browser checks its own cache, then the OS cache — you may have just been there.
2. If nobody remembers, the OS asks a **recursive resolver** (usually your ISP's, or a public one like 1.1.1.1). The resolver does the legwork on your behalf.
3. The resolver asks a **root server**: "Who handles `.com`?" The root points to the `.com` **TLD servers**.
4. The resolver asks a TLD server: "Who is authoritative for `example.com`?" It gets the domain's **authoritative name server**.
5. The resolver asks that server for the actual record and finally gets the IP — an `A` record (or `AAAA` for IPv6). `CNAME` records instead alias one name to another.
6. The answer travels back and is cached at every level, with a **TTL** (time-to-live) deciding how long each cache may trust it.

That whole dance typically finishes in milliseconds because of caching — and DNS normally runs over UDP precisely because the question and answer are tiny (with TCP as the fallback for large responses).

### A worked example: your first visit to a brand-new site

Say you type `blog.freshsite.in` and nobody anywhere has cached anything yet. Watch the chain of referrals — notice that each server answers with *"I don't know, but ask them"*, which is what makes DNS a distributed system rather than one giant phone book:

1. Your laptop asks the recursive resolver: "What is the IP of `blog.freshsite.in`?"
2. The resolver asks a **root server**: "Who runs `.in`?" → "These `.in` TLD servers — ask them."
3. The resolver asks a **.in TLD server**: "Who is authoritative for `freshsite.in`?" → "The name servers registered for `freshsite.in` — ask them."
4. The resolver asks the **authoritative server**: "What is the IP of `blog.freshsite.in`?" → Finally, an actual answer: an `A` record, `203.0.113.45`, with a TTL of 300 seconds.
5. The resolver caches that answer for 300 seconds, returns it to your laptop, and your laptop caches it too. Your browser finally has an IP and can open the TCP connection.

Ten minutes from now, a colleague on the same network visits the same page: the resolver answers straight from its cache until the TTL expires — no root, no TLD, no authoritative server involved. Caching at every level is why a planet-sized database can answer in milliseconds.

### The record types worth knowing

DNS stores more than IPs. These five come up constantly in interviews and in real debugging:

| Record | Job | Example |
|---|---|---|
| **A** | Maps a name to an IPv4 address | `example.com → 93.184.216.34` |
| **AAAA** | Maps a name to an IPv6 address | `example.com → 2606:2800:21f:cb07:...` |
| **CNAME** | Aliases one name to another name | `www.example.com → example.com` — the resolver then looks up the target |
| **MX** | Names the mail servers for a domain | Tells the world where to deliver `user@example.com` email |
| **TXT** | Free-form text records | Used to prove domain ownership and for email anti-spoofing rules (SPF/DKIM) |
| **NS** | Names the authoritative servers for the domain | The referral the TLD server gives |

One rule with real consequences: a `CNAME` cannot coexist with other records for the same name, and a name with a CNAME must point to a *name*, never directly to an IP. And TTL is a genuine trade-off — a long TTL means fast, cheap lookups but slow changes (after moving servers, the world keeps visiting the old IP until caches expire); a short TTL means changes spread within minutes but caches help less. Teams often lower the TTL a day before a big migration, then raise it again afterwards.

### Recursive vs authoritative — who does what

Two roles get confused constantly, so separate them cleanly:

- The **recursive resolver** is your agent. It accepts your question, chases down the answer by asking around, caches what it learns, and hands you the final result. Your ISP runs one; so do public services like `1.1.1.1` and `8.8.8.8`.
- The **authoritative server** is the source of truth for one domain. It holds the actual records the domain owner configured and answers only for those — it does no chasing for strangers.

**Common mistakes / interview traps**

- "DNS converts an IP into a name." Normally it is the other way round (reverse DNS exists, but it is not the everyday job).
- "Your browser asks the root server." No — your browser asks the resolver; the resolver is the one that walks root → TLD → authoritative.
- "DNS uses only UDP." Mostly, for speed — but large responses and zone transfers fall back to TCP, and modern encrypted DNS (DoH/DoT) uses TCP-based transports too.
- Forgetting TTL when asked "why does a website move take time to show up everywhere?" The old answer is still cached across the Internet until TTLs expire.

## Routing & IP basics

An **IP address** is a logical address assigned to an interface; on IPv4 it is 32 bits written as four decimal octets (`192.168.1.10`). Addresses are hierarchical: a **subnet mask** (or CIDR suffix like `/24`) splits the address into a *network part* (which neighbourhood) and a *host part* (which house). Two devices with the same network part can talk directly; anything else must go through a **router** — a device with one foot in each network whose whole job is forwarding packets hop by hop toward the destination network, choosing the next hop from its routing table.

**NAT (Network Address Translation)** is why your whole home shares one public IP. Your router rewrites packets on the way out: your laptop's private address (`192.168.x.x` — ranges reserved as non-routable on the open Internet, along with `10.x` and `172.16–31.x`) becomes the router's single public address, with a port number tracking which internal device owns which conversation; replies get translated back on the way in. NAT conserves the exhausted IPv4 address space and, as a side effect, hides the internal layout of your network from the outside.

So the full journey of a web request: DNS turns the name into an IP; your machine notices the IP is on another network and sends the packet to the default gateway; NAT rewrites it as it leaves home; routers forward it across the Internet, each reading only the destination network; the far side performs the TCP handshake, then the TLS handshake, and only then does your `GET /` request finally travel.

### Subnets — reading an address like a local

The CIDR suffix is the whole subnet idea in one number. `/24` means the first 24 bits are the network part and the last 8 bits are the host part. Worked example:

- Address: `192.168.1.10/24`, mask `255.255.255.0`.
- Network part: `192.168.1` — the neighbourhood. Host part: `10` — the house.
- Every address from `192.168.1.0` to `192.168.1.255` is in this subnet: 256 addresses, of which `.0` names the network itself and `.255` is the broadcast address ("everyone on this subnet, listen"), leaving 254 usable host addresses.

Now the decision every machine makes for *every single packet*: "Is the destination in my subnet?" Your laptop wants `192.168.1.25` — same network part, so it delivers directly on the local link. It wants `93.184.216.34` — different network part, so the packet goes to the **default gateway** (usually the router, often `192.168.1.1`) with the silent instruction: "You figure out the rest." That one decision — *local, or hand it to the gateway* — is the seed from which the whole Internet grows.

### Routers and routing tables

A router's entire mind is its **routing table**: rows of "to reach network X, send the packet out interface Y towards next-hop Z." When a packet arrives, the router:

1. Reads the destination IP from the packet header.
2. Finds the matching row — if several rows match, the *most specific* (longest prefix) wins, so a `/24` row beats a `/16` row.
3. Forwards the packet out the listed interface, wrapped in a fresh frame for that link, with the next hop's MAC address on it.

Routers learn these rows three ways: directly connected networks are automatic; administrators can type **static routes** by hand; and on the open Internet, routers exchange routes automatically using **BGP** (Border Gateway Protocol) — the protocol that stitches thousands of independent networks (ISPs, companies, universities) into one Internet. You do not need BGP internals for a fresher interview; you need the sentence: *no single router knows the whole path — each only knows the next hop, and the packet hops router to router until it arrives.*

### Private vs public addresses, and NAT up close

IPv4 has about 4.3 billion addresses and the world has far more devices than that, so three ranges are reserved as **private** — usable inside any home or company, never routed on the public Internet:

- `10.0.0.0 – 10.255.255.255` (common inside companies)
- `172.16.0.0 – 172.31.255.255`
- `192.168.0.0 – 192.168.255.255` (your home Wi-Fi)

NAT is the bridge between the private world and the public one. Concrete walk-through: your laptop `192.168.1.10` opens a connection to a server from source port `51234`. As the packet leaves, the router rewrites it to appear as the router's public address, say `49.37.10.5`, source port `62001`, and jots down the mapping: *"`49.37.10.5:62001` means laptop `192.168.1.10:51234`."* Your phone does the same thing a minute later and gets port `62002` on the *same* public IP. When replies return, the router reads the destination port, looks up its note, and delivers each packet to the right device. One public address, many private devices, separated purely by port numbers — that trick (technically PAT, port address translation) is what "NAT" means in every home.

Two consequences worth saying out loud: NAT is **not** a security product (the hiding is a side effect of address rewriting — a real firewall makes explicit allow/deny decisions), and NAT makes it awkward for outsiders to start a conversation *inward*, which is why hosting a server or some peer-to-peer apps behind NAT need extra configuration.

### IPv6 in one paragraph

IPv6 is IPv4's successor: 128-bit addresses written in hexadecimal groups (`2606:2800:21f:cb07:682:d722:f59:10bd`), giving an effectively unlimited supply. With addresses that plentiful, every device can have its own public address and NAT becomes unnecessary (though firewalls absolutely remain). Interviewers mainly check that you know *why* it exists — IPv4 ran out — and the headline facts: 128 bits versus 32, hex versus dotted decimal, `AAAA` records instead of `A`. The Internet currently runs both side by side.

**Common mistakes / interview traps**

- "Each device at home has its own public IP." No — usually one public IP per household connection, shared through NAT.
- Applying the subnet mask to the wrong thing: the mask splits *one address* into network and host parts; it is not a filter or a security boundary by itself.
- "The router knows the full path to the server." It knows only the next hop. Hop-by-hop is the design.
- Mixing up gateway and DNS: the gateway forwards packets; DNS only supplies the address. Different jobs, different sections of this chapter.

## How a web request actually travels — putting it all together

Every section above is one slice of a single story. Here it is end to end, the way interviewers love to hear it — this is the expanded version of the classic "what happens when you type a URL?" question.

Say you type `https://shop.example.com/products` and press Enter.

1. **Cache checks everywhere.** The browser checks its cache for the page and for old DNS answers. Suppose it is a cold start: nothing is cached.
2. **DNS resolution.** The resolver walks root → TLD → authoritative server and returns `shop.example.com → 203.0.113.80`, TTL 300. The answer is cached at the resolver and on your machine.
3. **Local or not?** Your laptop applies its subnet mask: `203.0.113.80` is not in `192.168.1.0/24`, so packets will go to the default gateway — your router.
4. **TCP handshake.** Your machine sends SYN to `203.0.113.80:443` via the gateway; the router performs NAT on the way out; SYN-ACK returns; you answer ACK. A connection exists. (Nothing has been encrypted yet, and no HTTP has been sent — only introductions.)
5. **TLS handshake.** ClientHello, the server's certificate (checked against its trusted authorities and the name `shop.example.com`), key agreement, Finished. Now both sides share a secret session key and everything further is encrypted.
6. **The HTTP request — finally.** Inside the tunnel: `GET /products HTTP/1.1`, `Host: shop.example.com`, your login cookie. Routers along the path see only an encrypted blob moving between two IP addresses.
7. **The response and the waterfall.** The server replies `200 OK` with HTML. Your browser parses it, spots references to CSS, JavaScript, and images, and fires off more requests — reusing the same connection (HTTP/2 multiplexing them), each one a full trip through the layers above.
8. **Teardown.** When the tab closes or the connection idles out, FIN/ACK exchanges close TCP politely in both directions. The DNS answer stays cached for its TTL, so your next visit skips step 2 entirely.

Notice what this story proves: the layers are not exam decoration. DNS, IP routing, NAT, TCP, TLS, and HTTP each appear at a specific moment, doing exactly the one job their layer promises. If you can narrate this journey without scrambling the order — *names first, then connection, then security, then conversation* — you can answer almost any fresher networking question they build on top of it.

## Interview questions

**1. What are the OSI layers, and how does TCP/IP differ?**
> OSI is a seven-layer teaching model, from physical cables up to the application, where each layer serves the one above it. TCP/IP is the model the real Internet runs on and has four layers — its application layer absorbs OSI's top three. The layers I always name precisely are transport, where TCP and UDP live, and network, where IP addresses and routing live.

**2. Explain the TCP three-way handshake.**
> The client sends a SYN asking to open a connection and proposing a starting sequence number, and the server replies with SYN-ACK, agreeing and proposing its own number. The client answers ACK, and only then does any real data flow. This exchange synchronises both sides' sequence numbers, which is what later makes in-order, guaranteed delivery possible.

**3. TCP vs UDP — when is each the right choice?**
> TCP guarantees in-order, complete delivery with retransmissions and acknowledgements, at the cost of a handshake and more delay. UDP guarantees nothing but is fast and lightweight, which is perfect when a late packet is useless anyway. So files, web pages, and emails ride on TCP, while live calls, games, and small DNS lookups ride on UDP.

**4. What is the difference between HTTP and HTTPS?**
> HTTP sends requests and responses as readable plain text, so anyone positioned between you and the server can read or modify them. HTTPS carries that same HTTP inside a TLS tunnel: the server proves its identity with a certificate, both sides agree on a session key, and everything after is encrypted and tamper-checked. So HTTPS adds confidentiality, integrity, and authentication on top of plain HTTP.

**5. Describe the TLS handshake in plain words.**
> First the browser and server agree on encryption settings, then the server shows a certificate signed by a trusted authority to prove it owns the domain. Using asymmetric cryptography they safely agree on a fresh symmetric key, which is the fast kind of encryption. After that, the entire conversation travels encrypted under that session key, so slow asymmetric crypto is used only for the introduction.

**6. How does DNS resolution work, step by step?**
> The browser and OS check their caches first. If the answer is not cached, a recursive resolver asks a root server who handles the top-level domain, then asks that TLD server who is authoritative for the domain, then asks the authoritative server for the actual address record. The IP comes back and is cached at each level according to its TTL, which is why lookups are usually so fast.

**7. GET vs POST — and name a few status codes.**
> GET only reads a resource, carries its parameters in the URL, and should never change anything on the server. POST sends data in the body, usually to create something, and repeating it creates duplicates, so it is not idempotent. For statuses: 200 means OK, 201 Created, 404 means the resource is not found, 401 means you are not logged in, and 500 means the server itself failed.

**8. What is NAT, and why do we need it?**
> NAT is the router rewriting addresses so many devices on private addresses can share a single public IP. It uses port numbers to remember which internal device owns which outgoing conversation, then translates the replies back. We need it because IPv4 addresses ran out, and as a bonus it hides the internal structure of a home or office network.

**9. What is the difference between an IP address and a MAC address?**
> An IP address is a logical, hierarchical address that identifies a device on a network and changes when you join a different network; routers use it to forward packets across networks. A MAC address is a physical address burned into the network card, unique to that hardware, and it only matters within one local link. In short: IP gets the packet across the world, MAC makes the final hop to the right machine.

**10. What happens when you type a URL in the browser, network edition?**
> First DNS converts the domain name into the server's IP address. Since that IP is on another network, my machine sends the packet to its default gateway, NAT rewrites it on the way out, and routers forward it hop by hop. Then the TCP handshake opens the connection, the TLS handshake secures it for HTTPS, and only after that does the browser send its HTTP GET request and receive the page.

---
