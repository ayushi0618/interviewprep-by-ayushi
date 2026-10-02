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

## HTTP/HTTPS — the web's conversation

HTTP is the application-layer protocol browsers and servers speak. It is **request–response** and **stateless**: every request carries everything needed to understand it, and the server remembers nothing between requests (cookies and tokens bolt memory on top).

**The methods say what you mean:** `GET` reads a resource and must not change anything; `POST` creates something or submits data; `PUT` replaces a resource completely; `PATCH` changes part of it; `DELETE` removes it. **Status codes say how it went:** `2xx` success (200 OK, 201 Created), `3xx` redirection (301 Moved Permanently, 304 Not Modified — "your cached copy is still good"), `4xx` client's fault (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found), `5xx` server's fault (500 Internal Server Error).

A single page load is actually dozens of these conversations: one for the HTML, then the browser reads it and fires parallel requests for CSS, JavaScript, images, and API calls — all over connections that HTTP/1.1 keeps open (keep-alive) and HTTP/2 multiplexes over a single connection so they don't queue behind each other.

### HTTPS: HTTP with a locked tunnel

HTTPS is HTTP carried inside **TLS** encryption. The TLS handshake, in plain words: after TCP connects, the browser and server agree on encryption settings; the server presents a **certificate** — a signed ID card from a trusted Certificate Authority proving "I really am this domain"; both sides use **asymmetric cryptography** (slow but needs no pre-shared secret) just long enough to safely agree on a fresh **symmetric session key**; from then on, everything travels encrypted with that fast symmetric key, and each message carries a tamper check. You get three things: confidentiality (nobody in the middle can read it), integrity (nobody can silently change it), and authentication (you really are talking to your bank, not an impostor).

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

## Routing & IP basics

An **IP address** is a logical address assigned to an interface; on IPv4 it is 32 bits written as four decimal octets (`192.168.1.10`). Addresses are hierarchical: a **subnet mask** (or CIDR suffix like `/24`) splits the address into a *network part* (which neighbourhood) and a *host part* (which house). Two devices with the same network part can talk directly; anything else must go through a **router** — a device with one foot in each network whose whole job is forwarding packets hop by hop toward the destination network, choosing the next hop from its routing table.

**NAT (Network Address Translation)** is why your whole home shares one public IP. Your router rewrites packets on the way out: your laptop's private address (`192.168.x.x` — ranges reserved as non-routable on the open Internet, along with `10.x` and `172.16–31.x`) becomes the router's single public address, with a port number tracking which internal device owns which conversation; replies get translated back on the way in. NAT conserves the exhausted IPv4 address space and, as a side effect, hides the internal layout of your network from the outside.

So the full journey of a web request: DNS turns the name into an IP; your machine notices the IP is on another network and sends the packet to the default gateway; NAT rewrites it as it leaves home; routers forward it across the Internet, each reading only the destination network; the far side performs the TCP handshake, then the TLS handshake, and only then does your `GET /` request finally travel.

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
