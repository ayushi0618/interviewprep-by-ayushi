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

## TCP deep dive — windows, slow start, and retransmission

The TCP vs UDP chapter described reliability in outline: sequence numbers, ACKs, retransmission, "flow and congestion control." This chapter opens that box, because the guaranteed follow-up is always mechanical: *how exactly does TCP avoid overwhelming the receiver — and the network?* Two different dangers, two different windows, and the sender obeys the stricter of the two.

### Flow control — protecting the receiver

Imagine a fast server streaming to a phone that's busy rendering. Without a brake, bytes arrive faster than the app reads them, the receive buffer overflows, and packets drop — the exact waste TCP exists to prevent. The brake is the **receive window (rwnd)**: every ACK from the receiver carries a number, "you may have this many bytes outstanding beyond what I've acknowledged — that's my free buffer." The sender must keep unacknowledged data ≤ rwnd. As the app drains the buffer, the advertised window reopens; if the app stalls, the window slides shut to zero and the sender politely probes once in a while to ask "any room yet?" That probing detail (the persist timer) is a lovely thing to mention: TCP doesn't deadlock even at a closed window.

Worked numbers: segments carry **MSS = 1000 bytes**; the receiver advertises rwnd = 6000; so at most **6000 bytes = 6 segments** may be in flight unacknowledged. The sender fires segments 1–6, then *must wait* — segment 7 waits for an ACK to reopen space. When the ACK for segments 1–2 lands, the window slides forward two slots and segments 7–8 leave. This sliding is why it's called a **sliding window** protocol: a window of allowed-in-flight bytes gliding over the stream.

### Congestion control — protecting the network

The receiver might be happy while the *path* is drowning — a router in the middle has a queue, and when it overflows it drops packets (tail drop) regardless of anyone's window. So the sender maintains a second, self-imposed limit: the **congestion window (cwnd)**, its private estimate of what the network can hold. The real sending limit is:

**Bytes in flight ≤ min(rwnd, cwnd)** — one window guards the receiver; the other guards the journey.

cwnd is managed by the Internet's most successful piece of politeness, built on **AIMD** — additive increase, multiplicative decrease — driven by a dance called slow start:

1. **Slow start:** cwnd begins tiny (say 1 segment) and **doubles every round-trip time**: 1, 2, 4, 8, 16… It's called "slow" only compared to blasting at full rate — it's exponential growth, probing for the ceiling quickly.
2. **Congestion avoidance:** once cwnd crosses a threshold (**ssthresh**), growth turns linear: roughly **+1 segment per RTT**. Now we're carefully inching upward, not leaping.
3. **On packet loss** (the smoke signal of congestion): ssthresh is set to half the current cwnd, and cwnd drops — multiplicatively. If the loss was signalled by **3 duplicate ACKs** (the receiver keeps acknowledging the same byte because later segments arrived — the pipe is clearly still flowing), **fast retransmit** resends the missing segment *now* instead of waiting for the timer, and cwnd resumes from ssthresh (fast recovery). If instead the timer expires — no ACKs at all, a worse sign — cwnd crashes back to 1 and slow start begins again.

Watch one connection's life, MSS = 1 KB, ssthresh starts at 8:

| Round trip (RTT) | cwnd (segments) | Phase |
|---|---|---|
| 1 | 1 | Slow start |
| 2 | 2 | Slow start |
| 3 | 4 | Slow start |
| 4 | 8 | Reaches ssthresh → linear from here |
| 5 | 9 | Congestion avoidance |
| 6 | 10 | Congestion avoidance |
| 7 | 11 | Congestion avoidance |
| 8 | 12, then a segment is lost (3 dup ACKs) | ssthresh = 6, cwnd = 6 |
| 9 | 7 | Linear climb resumes |
| 10 | 8 | …and so on |

The graph of cwnd over time is a **sawtooth**: exponential launch, linear climb, halving drop, climb again. Every TCP connection on Earth is tracing this pattern right now, and the collective effect is the Internet's fairness miracle: when a link congests, *everyone* halves together; capacity frees; everyone climbs together. No central controller — just identical politeness. (Modern variants like CUBIC and BBR reshape the sawtooth, but AIMD's logic is the interview canon.)

### Retransmission — the timer behind the guarantee

How long does the sender wait before deciding a segment died? Too short: useless resent duplicates add to congestion. Too long: every loss is a stall. TCP measures the round-trip time of segments and maintains a smoothed estimate; the **retransmission timeout (RTO)** = estimate + a safety margin proportional to how much RTT jitters. On repeated failure the RTO **doubles** each time (exponential backoff — if the network is collapsing, shout less often). Fast retransmit (above) is the shortcut that saves most losses from ever touching this timer: three duplicate ACKs is the receiver saying "everything after byte N arrived except N itself" — resend N immediately.

One benign trap: duplicate ACKs can also be caused by mere reordering, so a single dup ACK means nothing — the threshold of three keeps TCP from panicking over packets that merely took a scenic route.

| | Flow control | Congestion control |
|---|---|---|
| Protects | The receiver | The network path |
| Window | rwnd, advertised by receiver in every ACK | cwnd, sender's private estimate |
| Signal | Buffer space the receiver reports | Packet loss (dup ACKs / timeout), delay, ECN |
| Who sets it | The receiving TCP | The sending TCP, via slow start + AIMD |
| Failure it prevents | Buffer overflow at a slow receiver | Router queue overflow, congestion collapse |

**Common mistakes / interview traps**

- Using rwnd and cwnd interchangeably. The sender obeys **min(rwnd, cwnd)** — say which protects whom.
- "Slow start is slow." It's exponential doubling of cwnd each RTT — slow only relative to sending at line rate immediately.
- Thinking every loss means starting over from 1. Timeout → cwnd = 1. Three duplicate ACKs → fast retransmit, cwnd halves to ssthresh. Two very different severities.
- Forgetting that congestion control is why TCP is *fair*: AIMD's halving and inching make competing connections converge to equal shares. UDP has no such manners — applications must add their own.

### The 30-second interview answer

> "TCP sends at most the minimum of two windows: rwnd, the receiver's advertised free buffer, which is flow control, and cwnd, the sender's estimate of network capacity, which is congestion control. cwnd grows exponentially in slow start until ssthresh, then linearly — additive increase; on loss it halves — multiplicative decrease — with fast retransmit on three duplicate ACKs, or a full reset to one segment on timeout. That sawtooth is what keeps the Internet both fast and fair."

## Load balancers & CDNs — how big sites stay up and fast

One server has hard ceilings: so many requests per second, and it's in exactly one city. Load balancers attack the first ceiling, CDNs the second, and between them they explain how a site serves millions without melting. Both are name-dropped in every system-design interview, and both reward knowing mechanism over slogan.

### Load balancing — the receptionist with many doctors

A **load balancer (LB)** sits in front of a pool of identical servers and assigns each incoming request to one of them — like a clinic receptionist calling patients to whichever doctor is free. The servers must be interchangeable, which forces a design rule you'll state in interviews: **keep application servers stateless** (no irreplaceable session data in one server's memory; sessions live in a shared store like Redis). Half of load-balancer questions are secretly statelessness questions.

**Layer 4 vs Layer 7** — where the receptionist reads the form:

| | L4 (transport layer) | L7 (application layer) |
|---|---|---|
| Decides by | IP addresses and ports only | URL path, headers, cookies, host |
| Sees the request content? | No — forwards raw TCP/UDP | Yes — parses HTTP |
| Can do | Blazing fast, protocol-agnostic | "Send `/api` to those servers, images to these," TLS termination, A/B splits |
| Analogy | A traffic cop waving cars by licence plate region | A receptionist who reads your form and directs you to the right department |

**Assignment algorithms** — the receptionist's choosing rule:

| Algorithm | Rule | Pitfall it carries |
|---|---|---|
| Round robin | Next server in line | Assumes all requests cost the same — they don't |
| Weighted round robin | Busier share for beefier servers | Weights go stale as machines change |
| Least connections | Whoever has fewest active requests | A better default when request costs vary |
| IP hash | Same client IP always lands on the same server | Buys session stickiness, sells evenness — uneven client mixes unbalance it |
| Consistent hashing | Client/server mapped on a hash ring | The cache-tier favourite: removing one server remaps only ~1/N of keys, not everything |

Two production details separate users from readers: **health checks** — the LB continuously probes each server (ideally an endpoint that verifies the app, not just an open port) and stops feeding the failures, draining a dying server gracefully. And the uncomfortable recursion: **the load balancer itself can fail** — real setups run an LB *pair* sharing a floating virtual IP, so "who balances the balancer" has an answer.

### CDNs — move the content to the user

Physics is the problem: light in fibre crosses continents in ~100+ ms round trip, and no code review fixes that. A **Content Delivery Network** plants caches in **edge locations** (Points of Presence) worldwide. The first visitor in Delhi requesting `logo.png` from an origin in Mumbai pays the full trip; the edge fetches it once, caches it, and serves the next thousand Delhi visitors locally in milliseconds. Effects compound: latency collapses, origin traffic collapses (a healthy 90% cache-hit ratio means the origin sees a tenth of the load), and TLS handshakes end at a nearby edge too.

CDNs cache what's cacheable — static assets, images, video, increasingly whole pages for anonymous users — governed by the same `Cache-Control` headers and TTLs you met in the DNS chapter. The pain is familiar from DNS too: **invalidation**. When a file changes, stale edge copies linger until TTL expiry unless you purge — which is why deployments fingerprint filenames (`app.8f3c.js`): a new version is a new URL, and the old cache entry can simply be abandoned. When you hear senior engineers mumble about cache invalidation being one of the two hard problems in computer science — this, at planetary scale, is what they mean.

### One request, end to end

A user in Delhi opens a shop whose servers live in Mumbai:

1. DNS (CDN-aware) resolves the site to the *nearest edge*, Delhi.
2. The browser connects to the Delhi edge. Static assets — logo, CSS, JS — are cache hits: served in ~10 ms, origin never involved.
3. The actual product API call isn't cacheable, so the edge forwards it over the CDN's optimized backbone to Mumbai, where an **L7 load balancer** terminates TLS and routes `/api/...` to a healthy app server chosen by least connections.
4. The app server does its work (database, cache) and the response travels back the fast path.
5. Total: physics-defying page, single-digit servers breathing easy.

**Common mistakes / interview traps**

- Making servers sticky instead of stateless. IP-hash stickiness is the workaround, not the architecture; the professional default is stateless servers + shared session store.
- A health check that only proves the port is open while the app behind it is dead. Check an endpoint that exercises the application.
- Proposing a CDN for personalized/dynamic data. Cache keys can't distinguish users safely by default — a cached private page served to a stranger is a legendary production incident.
- Forgetting the LB is a single point of failure until you pair it. Every "add a load balancer" answer should reflexively add "…in an active-passive pair."

### The 30-second interview answer

> "A load balancer spreads requests across stateless servers — L4 forwards by IP and port blindly and fast, L7 reads the HTTP request and can route by path or cookie. Algorithms range from round robin to least connections to consistent hashing for caches, and health checks keep traffic off dead servers. A CDN instead fights distance: edge caches near users serve static content locally, cutting both latency and origin load, with fingerprinted filenames to dodge the invalidation problem."

## WebSockets vs polling — getting the server to speak first

HTTP has an asymmetry problem: the client asks, the server answers, and the server can *never* simply speak first. But chat messages, live scores, and stock ticks are born on the server. Four techniques bridge the gap, evolving from crude to elegant — and knowing their costs is a favourite interview probe, because every fresher app eventually faces this exact decision.

### Polling — "any news? any news? any news?"

The client asks every few seconds: `GET /messages/new`. Cost it honestly. **10,000 users polling every 5 seconds = 2,000 requests per second** — complete with headers, TLS, authentication checks — and if real events arrive once a minute per user, ~99% of those responses say "nothing." Average staleness is half the interval (2.5 s here): messages feel laggy *despite* the heroic server load. Mobile radios and batteries pay too. Polling's defence is simplicity and that it works everywhere, always — for a "check the count every minute" feature, it remains the correct answer.

### Long polling — "wait until there IS news, then answer"

The client asks; the server **holds the request open** until an event occurs or a timeout (say 30 s) approaches, then answers; the client immediately asks again. Latency becomes near-real-time and empty responses mostly vanish. Costs move subtler: servers now *hold* thousands of idle connections (connection-holding is a real resource; thread-per-connection servers suffer), timeouts must dodge proxy limits (many cut connections at 30–60 s), and each cycle still pays full HTTP header overhead. Solid, respectable, and largely superseded by the next two.

### Server-Sent Events (SSE) — one-way, done right

For server→client-only streams, SSE keeps one HTTP response open forever and drips events down it as simple text (`data: ...` blocks). It rides plain HTTP (proxies and load balancers tolerate it), **reconnects automatically** with a `Last-Event-ID` so missed events can be replayed, and costs almost nothing extra. Notifications, live feeds, score tickers, progress bars — if the client never needs to *speak* on the same channel, SSE is the sweet spot. Brownie point: it's just HTTP, so debugging with curl actually works.

### WebSockets — the two-way upgrade

When both sides must speak freely, the client sends an ordinary HTTP request with an `Upgrade: websocket` header; the server replies **101 Switching Protocols**, and the connection transforms into a persistent, full-duplex channel of tiny **frames** (a couple of bytes of header versus hundreds for HTTP). Either side sends anytime. **Ping/pong** frames keep the path alive and detect corpses. Chat, collaborative editing, multiplayer games, live dashboards with client actions — this is their home. The price: connection state now lives on your servers, so scaling means sticky load-balancing and a **pub/sub fan-out** behind them (a message published for user 42 must find whichever server holds user 42's socket — Redis pub/sub is the classic glue). Tooling, proxies, and debugging all get one notch harder than plain HTTP.

| Technique | Direction | Latency | Overhead | Choose it for |
|---|---|---|---|---|
| Polling | Client asks repeatedly | ~½ interval stale | Very high — mostly empty responses | Rare checks, maximum simplicity |
| Long polling | Server holds, then answers | Near real-time | High — header churn, held connections | Legacy-friendly near-real-time |
| SSE | Server → client only | Real-time | Low, plain HTTP | Feeds, notifications, tickers, progress |
| WebSocket | Both ways, anytime | Real-time | Lowest per message after setup | Chat, collaboration, games, trading UIs |

**Common mistakes / interview traps**

- Polling aggressively "for real-time feel." The math kills it: thousands of empty requests per second still deliver multi-second staleness.
- Choosing WebSocket for a one-way feed. If the client only listens, SSE is simpler, firewall-friendlier, and auto-reconnects.
- Forgetting WebSocket scaling: one user's socket lives on one server — without a pub/sub layer behind them, half your chat messages teleport into the void.
- Saying long polling keeps a "connection to push through." It's still request–response; the server can only answer the *pending* request, then the cycle restarts.

### The 30-second interview answer

> "HTTP is client-speaks-first, so real-time features work around it. Polling is simplest but burns thousands of requests for seconds-stale data; long polling holds the request until an event, cutting latency but paying header churn and held connections. SSE streams one-way server events over plain HTTP with auto-reconnect — ideal for feeds and notifications. WebSocket upgrades the connection into a persistent two-way frame channel for chat and collaboration, and at scale it needs sticky balancing plus a pub/sub layer behind the servers."

## ARP, DHCP & ICMP — the invisible helpers

Before your laptop can ask for a single website, three quiet protocols have already done invisible work: **DHCP** gave it an identity, **ARP** taught it the neighbours' hardware addresses, and **ICMP** stands by to carry error reports and diagnostics. Nobody sees them when they work — which is exactly why interviewers ask. This chapter follows the first ten seconds after a laptop joins café Wi-Fi.

### DHCP — "I just got here. Who am I?"

A brand-new device has no IP address, doesn't know the gateway, doesn't know DNS. DHCP solves the bootstrap with a four-message dance remembered as **DORA**:

1. **Discover:** With no identity at all, the laptop broadcasts from `0.0.0.0` to everyone (`255.255.255.255`): "Is there a DHCP server out there?"
2. **Offer:** The router replies: "You may be `192.168.1.25`; your gateway is `192.168.1.1`; DNS is at `192.168.1.1` (or the ISP's); this lease lasts 24 hours."
3. **Request:** The laptop broadcasts "I accept that offer" (broadcast, so any other offering servers hear they've been passed over).
4. **Acknowledge:** The server confirms. Identity issued.

Two details with interview value: the address is a **lease**, not a property deed — the device asks to renew at half the lease time (12 hours here), which is how cafés recycle addresses for departed customers; and DHCP is why your home devices' IPs occasionally shuffle — nothing promised permanence.

### ARP — "I know the gateway's IP. But what's its MAC?"

Now the laptop wants to send its first DNS query. It knows the gateway *IP* (`192.168.1.1`) from DHCP, but the Wi-Fi frame it must build needs a **destination MAC address** — the hardware name from the layered-models chapter. **ARP (Address Resolution Protocol)** bridges the two address worlds, and it works by polite shouting:

1. Check the **ARP cache** first (recent answers live there for a few minutes). Empty? Ask.
2. **Broadcast** to the whole local network: "Who has `192.168.1.1`? Tell `192.168.1.25`."
3. The router replies directly (unicast): "I do — my MAC is `aa:bb:cc:...`."
4. Cache it, build the frame, send the DNS query. Total cost paid once per neighbour, until the cache entry ages out.

Notice the boundary: ARP broadcasts *cannot leave the subnet* — routers never forward them — because MAC addresses only have meaning on the local link. This is also why ARP is a security soft spot: there's no authentication, so a malicious device can answer "I'm the gateway" and intercept traffic (**ARP spoofing**). One honest sentence on that makes you sound like you've thought past the textbook.

### ICMP — the network's messenger and error channel

**ICMP (Internet Control Message Protocol)** carries no user data at all; it carries *news about* packets — the postal service's "could not deliver" slips and the diagnostic probes your tools are built on.

- **ping** sends an ICMP **echo request**; the destination's echo reply plus the round-trip time proves reachability and measures latency in one stroke. (With the trap: many firewalls drop ICMP, so "ping failed" can mean "filtered," not "dead.")
- **traceroute** (tracert on Windows) abuses the **TTL** field brilliantly. Every IP packet carries a Time-To-Live counter that each router decrements; at zero, the router discards the packet *and* sends back an ICMP "Time Exceeded" — revealing itself. So traceroute sends probes with TTL=1 (dies at and reveals router 1), TTL=2 (router 2), TTL=3… until the probe reaches the destination and an echo/port-unreachable comes back instead. The path assembles itself from the error messages of its own deaths.

### The first ten seconds, assembled

```
Laptop joins café Wi-Fi
  → DHCP (DORA): "I'm 192.168.1.25. Gateway 192.168.1.1, DNS 192.168.1.1, lease 24h."
  → ARP broadcast: "Who has 192.168.1.1?" → the router's MAC.
  → DNS query (inside frames addressed to that MAC): "example.com = ?"
  → ARP again if any new local neighbour is needed; then TCP, TLS, HTTP…
```

**Common mistakes / interview traps**

- "DHCP assigns MAC addresses." By the time DHCP runs, the device *has* a MAC (it's burned into the hardware) — DHCP leases it an *IP*, plus gateway and DNS.
- "ARP resolves names like DNS does." DNS maps *names → IPs* across the planet; ARP maps *IPs → MACs* on one local link. Different layer, different universe.
- Claiming traceroute asks routers for their names. It never asks anything — it reads the return addresses on Time Exceeded reports triggered by dying probes.
- "ping tests whether the server is up." It tests whether ICMP echo gets answered — a live, perfectly healthy server behind an ICMP-filtering firewall pings like a corpse.

### The 30-second interview answer

> "DHCP bootstraps a new device with a leased IP address, gateway, and DNS servers via the Discover–Offer–Request–Acknowledge exchange. ARP then resolves the gateway's IP to its MAC address on the local link — broadcast the question, unicast the answer, cache the result — because frames need hardware addresses while routing thinks in IPs. ICMP carries the network's control messages: echo request/reply powers ping, and traceroute exploits TTL expiry so each router reveals itself by reporting the probe it killed."

## HTTP/2 & HTTP/3 — same conversation, faster plumbing

The methods, status codes, headers — everything you learned in the HTTP chapter — never changed across versions. What changed is *how bytes move underneath*. This is the deep dive on the one-breath summary from that chapter, because "what's new in HTTP/2 and 3?" is asked constantly and answered vaguely by almost everyone.

### HTTP/1.1's ceiling

Keep-alive fixed the worst waste (a fresh TCP connection per request), but one stubborn rule remains: on a single connection, **responses must return in request order**. Request a tiny CSS file behind a slow database-backed page, and it waits — **head-of-line blocking**. Browsers coped by opening ~6 parallel connections per site, and sites coped with hacks that now sound medieval: *spriting* (gluing images into one big image), *domain sharding* (more domains, more connections), *inlining* (embedding files into HTML). Every hack is a fossil of this one limitation.

### HTTP/2 — many conversations, one connection

HTTP/2 (2015) keeps the semantics and rebuilds the transport frustrations:

- **Binary framing:** messages are chopped into small binary *frames*, each tagged with a **stream ID**. Frames from many requests interleave on one connection — true **multiplexing**. The CSS no longer queues behind the slow page; both flow simultaneously, each reassembled by stream ID.
- **HPACK header compression:** HTTP headers are notoriously repetitive (`user-agent`, cookies, `:path` families repeat on every request). HPACK keeps a shared table of previously seen headers and sends *references* instead of text — headers shrink to a few bytes.
- **Prioritization:** streams can declare weights so critical resources (HTML, CSS) outrank decorative ones on a congested connection.
- **Server push** (the honest historical footnote): servers could push resources before being asked. It mostly guessed wrong, wasted bandwidth on already-cached files, and browsers have since removed it — know it as a well-intentioned feature that died of cache-blindness.

But one floor remained: HTTP/2 still runs on **TCP**, and TCP promises one ordered byte stream. Lose a single packet carrying frames of five streams, and *all five stall* until retransmission — TCP knows nothing of streams. Head-of-line blocking was evicted from the application layer and took refuge one floor below.

### HTTP/3 — rebuilt on QUIC, goodbye TCP

HTTP/3 moves the whole thing onto **QUIC**, a transport protocol built over **UDP** (the only way to deploy a new transport without replacing every operating system on Earth):

- **Streams are independent at the transport level.** QUIC's multiplexing means one lost packet stalls only its own stream; the other four keep flowing. The TCP-era blocker is gone — this is the headline.
- **TLS 1.3 is built in**, not layered on top: transport and encryption handshakes merge, so a new connection costs **1 round trip** instead of TCP+TLS's 2–3, and a returning client can resume with **0-RTT** data (with a replay-attack caveat careful engineers mention).
- **Connection migration:** QUIC connections are identified by a **connection ID**, not the (IP, port) pair. Walk from home Wi-Fi to 4G mid-download and your IP changes — a TCP connection dies and restarts; a QUIC connection just continues from the new address. On mobile, this is not a party trick; it's Tuesday.

The fallback story matters too: some networks block or throttle UDP. Clients race both (a technique called Happy Eyeballs) and use whichever protocol answers — so HTTP/3 is an acceleration, never a requirement.

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Runs on | TCP | TCP | QUIC over UDP |
| Streams per connection | 1 (in order) | Many, multiplexed | Many, truly independent |
| Head-of-line blocking | Yes — full | At TCP layer only | No |
| Header compression | None | HPACK | QPACK (HPACK's QUIC-safe sibling) |
| Handshake cost | TCP + TLS ≈ 2–3 RTT | Same | 1 RTT (0-RTT on resumption) |
| Survives IP change (Wi-Fi → 4G) | No | No | Yes — connection migration |

**Common mistakes / interview traps**

- "HTTP/3 changed the methods/status codes." Semantics are identical; it's plumbing. GET is still GET.
- Crediting HTTP/2 with *eliminating* head-of-line blocking. It moved it down a layer — one lost TCP packet still stalls every stream. That's the very problem HTTP/3 exists to solve.
- Assuming HTTP/3 ditched encryption. QUIC *includes* TLS 1.3 mandatorily; there is no plaintext HTTP/3.
- Presenting server push as a current HTTP/2 feature to boast about. It's effectively deprecated — mentioning its failure earns more than reciting its promise.
- "HTTP/3 can't work where UDP is blocked." Clients fall back to HTTP/2 over TCP automatically.

### The 30-second interview answer

> "All three versions share the same HTTP semantics — what changed is transport. HTTP/1.1 answers requests in order on a connection, so one slow response blocks everything behind it. HTTP/2 multiplexes many streams over one TCP connection with HPACK header compression, but a single lost TCP packet still stalls all streams. HTTP/3 runs on QUIC over UDP, making streams fully independent, folding TLS 1.3 into a one-round-trip handshake, and surviving network changes via connection IDs instead of IP addresses."

## Subnetting drills — splitting networks without tears

The routing chapter taught what a subnet *is* with one worked `/24`. Interviews and exams go further: they hand you a network and demand you carve it. Subnetting is pure, learnable arithmetic — two formulas and the discipline to go largest-first. This chapter is the practice set.

The only rules you need:

- Borrow **b** bits from the host part → you get **2^b subnets**.
- Leave **h** host bits → each subnet holds **2^h addresses**, of which **2^h − 2 are usable** (subtract the network address and the broadcast address).
- Quick block method: in the interesting octet, **block size = 256 − mask value**. `/26` → mask `255.255.255.192` → blocks of 64: subnets start at .0, .64, .128, .192.

### Drill 1 — four equal subnets from 192.168.1.0/24

Requirement: 4 subnets. 2^2 = 4, so borrow 2 bits → new prefix **/26**, mask `255.255.255.192`, 64 addresses each, **62 usable hosts** each.

| Subnet | Network address | Usable hosts | Broadcast |
|---|---|---|---|
| 1 | 192.168.1.0/26 | .1 – .62 | .63 |
| 2 | 192.168.1.64/26 | .65 – .126 | .127 |
| 3 | 192.168.1.128/26 | .129 – .190 | .191 |
| 4 | 192.168.1.192/26 | .193 – .254 | .255 |

Read the table's rhythm once and you can regenerate it for any split: networks land on block boundaries (multiples of 64), the usable range is network+1 to broadcast−1, and the *next* subnet starts the moment the last one ends — subnets tile the space with no gaps and no overlaps.

### Drill 2 — VLSM: different-sized departments (the real-world version)

One network `192.168.10.0/24`, four needs: Dept A needs **100 hosts**, Dept B **50**, Dept C **25**, and a point-to-point link needs **2**. Equal splits waste addresses outrageously (a /26 for a 2-host link?), so use **Variable Length Subnet Masking** — and the golden rule: **allocate largest first**, so big blocks always find aligned space.

1. **A, 100 hosts:** needs 2^h − 2 ≥ 100 → h=7 → **/25** (126 usable). Assign `192.168.10.0/25` → network .0, hosts .1–.126, broadcast .127. *(Uses .0–.127.)*
2. **B, 50 hosts:** h=6 → **/26** (62 usable). Next free boundary: `192.168.10.128/26` → hosts .129–.190, broadcast .191. *(Uses .128–.191.)*
3. **C, 25 hosts:** h=5 → **/27** (30 usable). Assign `192.168.10.192/27` → hosts .193–.222, broadcast .223. *(Uses .192–.223.)*
4. **Link, 2 hosts:** h=2 → **/30** (2 usable — exactly right; /30 is the classic point-to-point mask). Assign `192.168.10.224/30` → hosts .225–.226, broadcast .227.

Addresses .228–.255 (28 addresses) remain for growth — and because we went largest-first, they're mostly contiguous. Try smallest-first instead and watch big blocks fail to find aligned homes; that failure *is* the lesson.

### Drill 3 — same subnet or not? (the gateway question in disguise)

This check decides whether two devices talk directly or via the router — the "local or gateway?" decision from the routing chapter.

- `10.1.1.77/25` vs `10.1.1.190/25`: block size = 256 − 128 = 128 → subnets .0–.127 and .128–.255. 77 lives in the first, 190 in the second → **different subnets** → packets go through the gateway.
- `172.16.35.9/22` vs `172.16.36.200/22`: mask `255.255.252.0`, interesting octet is the third; block size = 256 − 252 = 4 → third-octet ranges 32–35, 36–39. 35 and 36 sit in different blocks → **different subnets**. (This one catches everyone who only ever practiced on the last octet.)

**Common mistakes / interview traps**

- Forgetting the **−2**. A /27 has 32 addresses but 30 usable hosts — quoting 32 costs you the question.
- Borrowing bits for "number of subnets" from the wrong end: borrowed bits come from the *host* part, shrinking hosts per subnet. Every borrowed bit doubles subnets and halves hosts — state both effects.
- In VLSM, allocating smallest-first and then finding no aligned space for the big subnet. Largest-first isn't politeness; it's geometric necessity.
- Placing a subnet's network address mid-block (like `192.168.1.70/26`). Networks begin on block boundaries — .70/26 isn't a network address, it's a host *inside* .64/26.

### The 30-second interview answer

> "Subnetting is bit arithmetic: borrowing b bits from the host part gives 2^b subnets with 2^h − 2 usable hosts each. A /24 split four ways becomes four /26s of 62 hosts. For mixed needs I use VLSM, allocating largest first — 100 hosts gets a /25, 50 a /26, 25 a /27, a point-to-point link a /30 — so blocks stay aligned and nothing overlaps. And to test whether two addresses share a subnet, I compare their network parts under the mask: same network, direct delivery; different, via the gateway."

---
