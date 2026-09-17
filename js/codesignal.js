// CodeSignal-style industry coding: one problem, four levels, each built on the last.
//
// CS_FORMAT     — how the assessment is shaped and what each level usually asks for.
// CS_PLAYBOOK   — the habits that decide whether level 4 is reachable at all.
// CS_CHALLENGES — practice challenges: [{ id, name, tag, blurb, story, structures,
//                 patterns, levels: [{ n, name, minutes, ops, idea, design, code,
//                 trace, pitfalls }] }]
//
// Every code block below was executed against a test suite before being pasted in.
// These are original practice reconstructions of a publicly documented format, not
// questions from any real assessment.

const CS_FORMAT = {
  intro:
    "An industry coding assessment is not a puzzle. It is one small system — a file store, a bank, " +
    "a database — specified in four levels, each one landing on the code you already wrote. Nothing " +
    "here needs an algorithm you do not already know: the whole test is whether your level-1 code " +
    "can absorb level 3 without being torn up.",
  facts: [
    ["Shape", "One problem, four levels, one class that keeps growing."],
    ["Time", "Around 90 minutes for all four — roughly 15 / 20 / 25 / 30."],
    ["Scoring", "Per level, and earlier levels keep being tested. Three solid levels beat four broken ones."],
    ["Language", "Your choice. Python is the shortest path if you know its containers cold."],
    ["Tests", "You can run them. A level you cannot run green is a level you have not finished."],
  ],
  levels: [
    {
      n: 1,
      name: "The nouns",
      what: "Create, read, update, delete. Two or three operations over one dictionary.",
      ask: "Can you model the entity and return the right thing when it does not exist?",
    },
    {
      n: 2,
      name: "The query",
      what: "Search, filter, or rank what level 1 stores — usually a top-n with an exact tie-break rule.",
      ask: "Can you sort by a compound key without writing a comparator?",
    },
    {
      n: 3,
      name: "Time",
      what: "Every operation gains a timestamp, and records gain a lifetime — a TTL, a delay, a deadline.",
      ask: "Does your state have somewhere to put an expiry, or does every method need rewriting?",
    },
    {
      n: 4,
      name: "History",
      what: "Look backwards or undo: roll back, restore a backup, read a past balance, merge two entities.",
      ask: "Did you funnel writes through one place, so recording them is a three-line change?",
    },
  ],
  note:
    "The nouns change between challenges. The ladder does not: state, then a ranked query over that " +
    "state, then time, then history. Recognising which rung you are on tells you what to build before " +
    "you have read the whole page.",
};

const CS_PLAYBOOK = [
  {
    h: "Read all four levels before writing one",
    p: "The five minutes this costs are the highest-return minutes of the session. Level 3 always adds " +
       "timestamps and level 4 always looks backwards — if you know that at minute zero, you will put " +
       "records in an object instead of an int, and a rewrite at minute 50 turns into a new field.",
  },
  {
    h: "Wrap the value the moment it has two attributes",
    p: "name -> size is fine until size acquires an expiry. A small class (or a tuple you consistently " +
       "unpack) costs three lines now and saves the level-3 rewrite. This is the single decision that " +
       "most often decides whether level 4 gets finished.",
  },
  {
    h: "Funnel every write through one method",
    p: "If the only place that mutates state is _write(), then versioning, logging, and rollback are " +
       "changes to that one method. If eight methods each poke the dictionary, level 4 is eight edits " +
       "and at least one forgotten path.",
  },
  {
    h: "Make time explicit and pull, never push",
    p: "Nothing expires on its own — there is no clock. Either check liveness on read (alive_at) or " +
       "settle what is due at the top of every operation (_advance). Pick one per concept and apply it " +
       "everywhere; mixing the two is how a balance ends up right in one method and stale in another.",
  },
  {
    h: "Keep earlier levels callable",
    p: "When level 3 renames upload() to upload_at(), the level-1 tests still run. Keep the old names as " +
       "one-line wrappers that pass a default timestamp. Deleting them scores zero on levels you had " +
       "already solved.",
  },
  {
    h: "Return values are part of the spec",
    p: "False versus None versus an exception is graded. Read the signature: 'returns false if the " +
       "account already exists' means return False — not raise, not None. Write the failure branch first.",
  },
  {
    h: "Sort by a tuple, never by a comparator",
    p: "Largest first, then name ascending, is key=lambda x: (-x.size, x.name). Reaching for " +
       "functools.cmp_to_key here is a smell — and mixing reverse=True with a secondary ascending key " +
       "silently reverses the tie-break too.",
  },
  {
    h: "Ship a level before starting the next",
    p: "Run the tests, watch them go green, and only then read on. A half-finished level 4 sitting on " +
       "top of a level 3 you broke is the worst outcome available, and it is the common one.",
  },
];

const CS_PITFALLS = [
  "Inclusive versus exclusive expiry. Decide once whether a file with ttl 5 created at t=1 is alive at t=6, write it in a comment, and use the same comparison everywhere.",
  "Copies that get a fresh lifetime. A copy usually inherits the source's remaining life; a new TTL means a copy can outlive its original, which is rarely what the spec wants.",
  "Ties that are not broken. 'Top 10 by size' always has a second key hiding in it. Unspecified ties are the most common source of a test that passes locally and fails in the grader.",
  "State read before it is settled. If cashback lands at t+24h, then every operation after t+24h must settle it first — including the read-only ones.",
  "History recorded at observation time. A delayed credit belongs in the log at the moment it came due, not the moment someone asked. Get this wrong and every historical query after it is off.",
  "Names freed by expiry. Once a record has expired, its key is available again — the uniqueness check has to ask 'is it alive?', not 'is it in the dict?'.",
  "Empty containers left behind. Deleting the last field of a record should delete the record, or your 'how many keys' count quietly drifts.",
  "Unbounded logs. Version lists and backups grow forever. Nobody fails you for it at this size — but saying it out loud is free, and it is what the follow-up conversation is about.",
];

const CS_CHALLENGES = [

{
  id: "file-storage",
  name: "In-memory file storage",
  tag: "the classic",
  blurb: "Upload, read and copy files — then search them by prefix, expire them, and roll the whole store back to an earlier moment.",
  story:
    "You are writing the storage layer of a file-hosting service. Nothing touches a disk; every file is " +
    "an entry in a dictionary. The algorithmic content is almost zero, which is the point — what is " +
    "being measured is whether the shape you choose in level 1 survives contact with levels 3 and 4.",
  structures: ["dict", "str"],
  patterns: ["hash-map-seen"],
  levels: [
    {
      n: 1,
      name: "Store, read, copy",
      minutes: "10–15 min",
      ops: [
        ["FILE_UPLOAD(name, size)", "Add a new file. The name must not already be taken."],
        ["FILE_GET(name)", "The file's size, or nothing when there is no such file."],
        ["FILE_COPY(source, dest)", "Copy source onto dest. Overwriting dest is allowed; a missing source is not."],
      ],
      idea: [
        "One dictionary from name to size covers all three operations, and every one of them is O(1). There is no cleverness available here and none wanted.",
        "The only real decisions are the failure modes: uploading over an existing name is an error, copying from a missing file is an error, but getting a missing file is an ordinary None. Write those three branches first — they are what the tests poke at.",
      ],
      design: [
        "name -> size in a plain dict. Names are opaque strings; the slashes are decoration, not a tree.",
        "Overwrite on copy, error on upload — the asymmetry is in the spec, so it goes in a comment.",
        "Already worth asking: does anything later need a second attribute per file? (It does. Level 3 adds an expiry.)",
      ],
      code: `class FileStore:
    """Level 1 — a flat store of file name -> size."""

    def __init__(self):
        self.files = {}                            # name -> size in bytes

    def file_upload(self, name, size):
        """Add a new file. The name must be free."""
        if name in self.files:
            raise RuntimeError(f"file already exists: {name}")
        self.files[name] = size

    def file_get(self, name):
        """Size of the file, or None when there is no such file."""
        return self.files.get(name)

    def file_copy(self, source, dest):
        """Copy source onto dest, overwriting dest if it already exists."""
        if source not in self.files:
            raise RuntimeError(f"file not found: {source}")
        self.files[dest] = self.files[source]`,
      trace: `FILE_UPLOAD("/dir/a.txt", 100)     ->  ok
FILE_UPLOAD("/dir/a.txt", 200)     ->  error: file already exists
FILE_GET("/dir/a.txt")             ->  100
FILE_GET("/nope.txt")              ->  None
FILE_COPY("/dir/a.txt", "/b.txt")  ->  ok
FILE_GET("/b.txt")                 ->  100`,
      pitfalls: [
        "Returning 0 instead of None for a missing file — .get() already does the right thing.",
        "Making copy fail when dest exists. Re-read the sentence: only the source has to exist.",
        "Treating the name as a path and building a directory tree. Nothing in any level needs it.",
      ],
    },
    {
      n: 2,
      name: "Search by prefix, ranked by size",
      minutes: "15–20 min",
      ops: [
        ["FILE_SEARCH(prefix)", "The 10 largest files whose name starts with prefix. Ties on size break by name, ascending."],
      ],
      idea: [
        "Filter, sort, slice. n is small enough here that a linear scan per search is the right answer, and saying so out loud — 'this is O(n log n) per query; if searches dominated I would keep a sorted index per prefix' — is worth more than building the index.",
        "The whole level is really one line: the sort key. Largest size first, then name ascending, is key=lambda pair: (-size, name). Negating the numeric key is how you get two different directions out of one ascending sort.",
      ],
      design: [
        "No new state. Level 2 is a pure function of what level 1 already stores — a good sign that level 1 was shaped right.",
        "Sort (-size, name) rather than sorting twice or reaching for cmp_to_key.",
        "The cap of 10 is a slice, applied after the sort, never before.",
      ],
      code: `class FileStore:
    """Level 2 — level 1, plus prefix search ranked by size."""

    def __init__(self):
        self.files = {}                            # name -> size in bytes

    def file_upload(self, name, size):
        """Add a new file. The name must be free."""
        if name in self.files:
            raise RuntimeError(f"file already exists: {name}")
        self.files[name] = size

    def file_get(self, name):
        """Size of the file, or None when there is no such file."""
        return self.files.get(name)

    def file_copy(self, source, dest):
        """Copy source onto dest, overwriting dest if it already exists."""
        if source not in self.files:
            raise RuntimeError(f"file not found: {source}")
        self.files[dest] = self.files[source]

    def file_search(self, prefix):
        """The 10 largest files whose name starts with prefix.

        Ties on size are broken by name, ascending.
        """
        hits = [(size, name) for name, size in self.files.items()
                if name.startswith(prefix)]
        hits.sort(key=lambda pair: (-pair[0], pair[1]))
        return [name for _, name in hits[:10]]`,
      trace: `uploads:  /d/big 300, /d/mid 200, /d/small 100, /d/copy 100, /other 400

FILE_SEARCH("/d")   ->  ["/d/big", "/d/mid", "/d/copy", "/d/small"]
                         300        200       100        100
                                              ^ 100 = 100, so name order decides
FILE_SEARCH("/")    ->  ["/other", "/d/big", "/d/mid", "/d/copy", "/d/small"]
FILE_SEARCH("/zz")  ->  []`,
      pitfalls: [
        "sort(key=size, reverse=True) and then hoping names come out ascending — reverse flips the tie-break too.",
        "Slicing to 10 before sorting.",
        "Forgetting that prefix \"\" matches everything, which is exactly what the graders test.",
      ],
    },
    {
      n: 3,
      name: "Timestamps and time-to-live",
      minutes: "20–25 min",
      ops: [
        ["FILE_UPLOAD_AT(timestamp, name, size, ttl?)", "Upload at a moment in time. With a ttl, the file dies at timestamp + ttl."],
        ["FILE_GET_AT(timestamp, name)", "As before, but a file that has expired is simply not there."],
        ["FILE_COPY_AT(timestamp, source, dest)", "The copy inherits the source's remaining life."],
        ["FILE_SEARCH_AT(timestamp, prefix)", "Ranked search over the files alive at that moment."],
      ],
      idea: [
        "This is the level that punishes a thin level 1. A file now has two attributes, so the value in the dictionary stops being an int and becomes an object — and every method has to be touched. If you saw this coming, it is a ten-minute level.",
        "Store the absolute expiry, not the ttl. expires_at = timestamp + ttl is computed once at upload; afterwards every question about liveness is one comparison, and nobody has to remember when the file was created.",
        "Nothing expires by itself. There is no background thread and no clock — a file is dead exactly when someone asks about it after its expiry. That single alive_at check, called from one private helper, is the whole mechanism.",
        "Keep the level 1 and 2 methods alive as wrappers that pass timestamp 0. The old tests are still being run, and re-implementing them a second time is how the two versions drift apart.",
      ],
      design: [
        "A File object holding size and expires_at (None = forever), instead of a bare int.",
        "One _live(name, at) helper that every operation goes through, so 'missing' and 'expired' collapse into the same answer in exactly one place.",
        "Expiry is exclusive: a file created at t with ttl k is alive for t .. t+k-1 and gone at t+k. Decide it once, comment it, use the same comparison everywhere.",
        "A copy takes the source's expires_at verbatim, so it cannot outlive its original.",
      ],
      code: `class File:
    """A stored file: how big it is and when it stops existing."""

    __slots__ = ("size", "expires_at")

    def __init__(self, size, expires_at=None):
        self.size = size
        self.expires_at = expires_at               # None = lives forever

    def alive_at(self, at):
        return self.expires_at is None or at < self.expires_at


class FileStore:
    """Level 3 — every operation happens at a timestamp; files may have a TTL."""

    def __init__(self):
        self.files = {}                            # name -> File

    # --- internals ------------------------------------------------------
    def _live(self, name, at):
        """The file stored under name at time \`at\`, or None if gone/expired."""
        f = self.files.get(name)
        return f if f is not None and f.alive_at(at) else None

    # --- timestamped operations -----------------------------------------
    def file_upload_at(self, timestamp, name, size, ttl=None):
        if self._live(name, timestamp) is not None:
            raise RuntimeError(f"file already exists: {name}")
        expires_at = None if ttl is None else timestamp + ttl
        self.files[name] = File(size, expires_at)

    def file_get_at(self, timestamp, name):
        f = self._live(name, timestamp)
        return f.size if f is not None else None

    def file_copy_at(self, timestamp, source, dest):
        f = self._live(source, timestamp)
        if f is None:
            raise RuntimeError(f"file not found: {source}")
        # The copy inherits the source's remaining life, not a fresh TTL.
        self.files[dest] = File(f.size, f.expires_at)

    def file_search_at(self, timestamp, prefix):
        hits = [(f.size, name) for name, f in self.files.items()
                if name.startswith(prefix) and f.alive_at(timestamp)]
        hits.sort(key=lambda pair: (-pair[0], pair[1]))
        return [name for _, name in hits[:10]]

    # --- level 1 & 2 operations, still working --------------------------
    def file_upload(self, name, size):
        self.file_upload_at(0, name, size)

    def file_get(self, name):
        return self.file_get_at(0, name)

    def file_copy(self, source, dest):
        self.file_copy_at(0, source, dest)

    def file_search(self, prefix):
        return self.file_search_at(0, prefix)`,
      trace: `FILE_UPLOAD_AT(1, "/a.txt", 100, ttl=5)   ->  alive for t = 1 .. 5
FILE_GET_AT(5, "/a.txt")                  ->  100
FILE_GET_AT(6, "/a.txt")                  ->  None      (1 + 5 = 6, exclusive)
FILE_UPLOAD_AT(7, "/a.txt", 999)          ->  ok — the name was freed by expiry

FILE_UPLOAD_AT(0, "/src", 10, ttl=10)     ->  dies at t = 10
FILE_COPY_AT(5, "/src", "/dst")           ->  /dst also dies at t = 10, not t = 15`,
      pitfalls: [
        "Storing the ttl instead of the expiry, then needing the creation time in four different methods.",
        "Giving the copy a fresh ttl, so it outlives the file it came from.",
        "Letting an expired name block a new upload — the uniqueness check must ask whether the old file is alive, not whether the key is in the dict.",
        "Leaving search to filter on the dict alone, so expired files keep showing up in results.",
      ],
    },
    {
      n: 4,
      name: "Rollback",
      minutes: "25–30 min",
      ops: [
        ["ROLLBACK(timestamp, to_timestamp)", "Restore the store to its state at to_timestamp. A file that still had a TTL keeps the life it had left back then, now counted from timestamp."],
      ],
      idea: [
        "Undo needs a record of what happened, and the cheap way to get one is to stop letting methods write to the dictionary. One _write(timestamp, name, file) funnel updates the current state and appends to a per-name log — two lines each in upload and copy, and history comes for free.",
        "Rollback then becomes per-name and local: throw away every version newer than the target, look at what is left, and write that back as a new version stamped now. There is no global snapshot to diff and no need to replay anything.",
        "The subtle half is the TTL. A file that had three ticks left at the target moment should have three ticks left after the rollback — so the stored expiry is shifted by the gap: expires_at - to_timestamp is what remained, and timestamp + that is when it now dies.",
        "The other subtle half: a file whose expiry had already passed at the target moment must not come back. Its last version still says it existed, so liveness has to be re-checked against to_timestamp, not against now.",
      ],
      design: [
        "history: name -> [(timestamp, File | None)], append-only. None records a deletion, which is what a rollback that removes a file writes.",
        "Every mutation goes through _write. The reason level 4 is short is that level 3 had exactly two places that touched self.files.",
        "Rollback is itself an event: it appends a version at timestamp rather than rewriting the past, so two rollbacks in a row behave.",
        "The log grows without bound. At this scale it does not matter — say so, and say that a real system would compact it or cap the window.",
      ],
      code: `class File:
    """A stored file: how big it is and when it stops existing."""

    __slots__ = ("size", "expires_at")

    def __init__(self, size, expires_at=None):
        self.size = size
        self.expires_at = expires_at               # None = lives forever

    def alive_at(self, at):
        return self.expires_at is None or at < self.expires_at


class FileStore:
    """Level 4 — every write is versioned, so the store can roll back."""

    def __init__(self):
        self.files = {}                            # name -> File (current state)
        self.history = {}                          # name -> [(timestamp, File | None)]

    # --- internals ------------------------------------------------------
    def _live(self, name, at):
        """The file stored under name at time \`at\`, or None if gone/expired."""
        f = self.files.get(name)
        return f if f is not None and f.alive_at(at) else None

    def _write(self, timestamp, name, file):
        """The single funnel every mutation goes through: state + append-only log."""
        if file is None:
            self.files.pop(name, None)
        else:
            self.files[name] = file
        self.history.setdefault(name, []).append((timestamp, file))

    # --- timestamped operations -----------------------------------------
    def file_upload_at(self, timestamp, name, size, ttl=None):
        if self._live(name, timestamp) is not None:
            raise RuntimeError(f"file already exists: {name}")
        expires_at = None if ttl is None else timestamp + ttl
        self._write(timestamp, name, File(size, expires_at))

    def file_get_at(self, timestamp, name):
        f = self._live(name, timestamp)
        return f.size if f is not None else None

    def file_copy_at(self, timestamp, source, dest):
        f = self._live(source, timestamp)
        if f is None:
            raise RuntimeError(f"file not found: {source}")
        # The copy inherits the source's remaining life, not a fresh TTL.
        self._write(timestamp, dest, File(f.size, f.expires_at))

    def file_search_at(self, timestamp, prefix):
        hits = [(f.size, name) for name, f in self.files.items()
                if name.startswith(prefix) and f.alive_at(timestamp)]
        hits.sort(key=lambda pair: (-pair[0], pair[1]))
        return [name for _, name in hits[:10]]

    def rollback(self, timestamp, to_timestamp):
        """Restore the state of the store as it was at to_timestamp.

        A file that still had a TTL keeps the life it had left back then, now
        measured from \`timestamp\`.
        """
        for name, versions in list(self.history.items()):
            kept = [v for v in versions if v[0] <= to_timestamp]
            snapshot = kept[-1][1] if kept else None
            if snapshot is not None and not snapshot.alive_at(to_timestamp):
                snapshot = None                    # it had already expired back then
            restored = None
            if snapshot is not None:
                expires_at = snapshot.expires_at
                if expires_at is not None:
                    expires_at = timestamp + (expires_at - to_timestamp)
                restored = File(snapshot.size, expires_at)
            self.history[name] = kept
            self._write(timestamp, name, restored)

    # --- level 1 & 2 operations, still working --------------------------
    def file_upload(self, name, size):
        self.file_upload_at(0, name, size)

    def file_get(self, name):
        return self.file_get_at(0, name)

    def file_copy(self, source, dest):
        self.file_copy_at(0, source, dest)

    def file_search(self, prefix):
        return self.file_search_at(0, prefix)`,
      trace: `t=1  FILE_UPLOAD_AT(1, "/a", 10)
t=2  FILE_UPLOAD_AT(2, "/b", 20)
t=3  FILE_COPY_AT(3, "/a", "/c")
     files now: /a, /b, /c

t=10 ROLLBACK(10, to=2)
     /a  -> last version at or before t=2 is the upload   -> kept
     /b  -> last version at or before t=2 is the upload   -> kept
     /c  -> no version at or before t=2                   -> removed
     files now: /a, /b

TTL re-basing
t=0  FILE_UPLOAD_AT(0, "/x", 1, ttl=10)     ->  dies at t=10
t=100 ROLLBACK(100, to=5)                    ->  it had 5 ticks left at t=5
     FILE_GET_AT(104, "/x")  ->  1
     FILE_GET_AT(105, "/x")  ->  None`,
      pitfalls: [
        "Restoring the expiry verbatim, so a file rolled back long after the fact arrives already dead.",
        "Resurrecting a file that had expired before the target timestamp.",
        "Mutating history while iterating it — take list(...) of the items, or rebuild into a fresh dict.",
        "Rewriting the past instead of appending: a rollback that erases its own trace makes the second rollback wrong.",
      ],
    },
  ],
},

{
  id: "banking",
  name: "Banking system",
  tag: "time and money",
  blurb: "Accounts, deposits and transfers — then a spending leaderboard, payments that pay cashback a day later, and merging two customers into one.",
  story:
    "A ledger with four levels of requirements bolted onto it. What makes this one harder than the file " +
    "store is that level 3 introduces something that happens later — a credit due in 24 hours with no " +
    "thread to deliver it — and level 4 then asks what the balance was at a moment in the past, which " +
    "only works if the delayed credit was recorded at the right time.",
  structures: ["dict", "heapq", "bisect"],
  patterns: ["top-k-heap", "binary-search-index"],
  levels: [
    {
      n: 1,
      name: "Accounts, deposits, transfers",
      minutes: "10–15 min",
      ops: [
        ["CREATE_ACCOUNT(timestamp, account_id)", "True when created, False when the id is taken."],
        ["DEPOSIT(timestamp, account_id, amount)", "The new balance, or nothing when there is no such account."],
        ["TRANSFER(timestamp, source, target, amount)", "The source's new balance, or nothing when the transfer cannot happen."],
      ],
      idea: [
        "One dictionary from account id to balance. The timestamp is already in every signature but nothing uses it yet — that is the spec telling you, at minute one, that time is coming.",
        "Transfer is where the graders spend their tests: same account twice, either side missing, insufficient funds. Four guards, then two arithmetic lines. Write the guards before the arithmetic and the level takes ten minutes.",
      ],
      design: [
        "account_id -> balance, integers throughout. Money in these problems is never a float.",
        "False for 'already exists', None for 'cannot': the spec distinguishes them, so the code does too.",
        "Do the whole validation up front and mutate only after every check has passed — a transfer must not half-happen.",
      ],
      code: `class BankingSystem:
    """Level 1 — accounts, deposits, transfers."""

    def __init__(self):
        self.balances = {}                         # account_id -> balance

    def create_account(self, timestamp, account_id):
        """False when the account already exists — never an exception."""
        if account_id in self.balances:
            return False
        self.balances[account_id] = 0
        return True

    def deposit(self, timestamp, account_id, amount):
        """New balance, or None when there is no such account."""
        if account_id not in self.balances:
            return None
        self.balances[account_id] += amount
        return self.balances[account_id]

    def transfer(self, timestamp, source_id, target_id, amount):
        """Source's new balance, or None if the transfer cannot happen."""
        if source_id not in self.balances or target_id not in self.balances:
            return None
        if source_id == target_id or self.balances[source_id] < amount:
            return None
        self.balances[source_id] -= amount
        self.balances[target_id] += amount
        return self.balances[source_id]`,
      trace: `CREATE_ACCOUNT(1, "a")        ->  True
CREATE_ACCOUNT(2, "a")        ->  False
DEPOSIT(5, "a", 100)          ->  100
DEPOSIT(6, "ghost", 5)        ->  None
TRANSFER(7, "a", "b", 30)     ->  70
TRANSFER(8, "a", "a", 1)      ->  None   (same account)
TRANSFER(9, "a", "b", 1000)   ->  None   (insufficient funds)`,
      pitfalls: [
        "Letting a transfer to the same account through — it silently passes and then breaks the level-2 spend totals.",
        "Mutating the source before checking the target exists.",
        "Returning True/False where the spec asks for a balance, or raising where it asks for None.",
      ],
    },
    {
      n: 2,
      name: "Top spenders",
      minutes: "15–20 min",
      ops: [
        ["TOP_SPENDERS(timestamp, n)", "The n accounts that have sent out the most, as \"id(total)\". Most first, ties by id ascending. Accounts that never sent anything still rank, with 0."],
      ],
      idea: [
        "'Spending' is money leaving an account, so it is counted on the sender only, and it is a running total you maintain in transfer — not something you recompute by replaying history.",
        "The name says top-n, which makes people reach for a heap. With n accounts and a handful of queries, sorting is simpler, and a heap does not survive level 3 anyway (the totals change under it when payments start counting as spending). Sort a list of (-total, id) and slice.",
        "Accounts with zero outgoing still appear, so the counter is seeded at creation, not on first spend — a defaultdict would quietly drop them.",
      ],
      design: [
        "A second dict, account_id -> outgoing total, seeded to 0 in create_account.",
        "sorted(..., key=lambda kv: (-kv[1], kv[0])) — one pass, both directions, no comparator.",
        "Output formatting is part of the spec: \"id(total)\", no spaces. Build it with an f-string at the end, never store it.",
      ],
      code: `class BankingSystem:
    """Level 2 — level 1, plus a spending leaderboard."""

    def __init__(self):
        self.balances = {}                         # account_id -> balance
        self.outgoing = {}                         # account_id -> total money sent out

    def create_account(self, timestamp, account_id):
        """False when the account already exists — never an exception."""
        if account_id in self.balances:
            return False
        self.balances[account_id] = 0
        self.outgoing[account_id] = 0
        return True

    def deposit(self, timestamp, account_id, amount):
        """New balance, or None when there is no such account."""
        if account_id not in self.balances:
            return None
        self.balances[account_id] += amount
        return self.balances[account_id]

    def transfer(self, timestamp, source_id, target_id, amount):
        """Source's new balance, or None if the transfer cannot happen."""
        if source_id not in self.balances or target_id not in self.balances:
            return None
        if source_id == target_id or self.balances[source_id] < amount:
            return None
        self.balances[source_id] -= amount
        self.balances[target_id] += amount
        self.outgoing[source_id] += amount         # only the sender "spends"
        return self.balances[source_id]

    def top_spenders(self, timestamp, n):
        """The n biggest spenders, as "id(total)" strings.

        Most spent first; ties broken by account id, ascending. Accounts that
        have never sent anything still rank, with a total of 0.
        """
        ranked = sorted(self.outgoing.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{account_id}({total})" for account_id, total in ranked[:n]]`,
      trace: `accounts a, b, c created; a deposits 100
TRANSFER(7,  "a", "b", 30)
TOP_SPENDERS(11, 3)   ->  ["a(30)", "b(0)", "c(0)"]
                                     ^ never spent, still ranked, id order
TRANSFER(12, "b", "c", 30)
TOP_SPENDERS(13, 2)   ->  ["a(30)", "b(30)"]   (tie -> "a" before "b")
TOP_SPENDERS(14, 10)  ->  ["a(30)", "b(30)", "c(0)"]   (n larger than the bank)`,
      pitfalls: [
        "Counting the receiver's incoming as spending.",
        "Using a defaultdict so accounts with no outgoing never appear in the ranking.",
        "Assuming n is at most the number of accounts — slicing handles it, an index does not.",
      ],
    },
    {
      n: 3,
      name: "Payments and delayed cashback",
      minutes: "20–25 min",
      ops: [
        ["PAY(timestamp, account_id, amount)", "Spend outside the bank. Returns a payment id like \"payment1\", or nothing on insufficient funds."],
        ["GET_PAYMENT_STATUS(timestamp, account_id, payment_id)", "\"IN_PROGRESS\" or \"CASHBACK_RECEIVED\", or nothing when the payment is not that account's."],
        ["cashback", "2% of the payment, rounded down, credited exactly 24 hours (86,400,000 ms) later."],
      ],
      idea: [
        "Something has to happen at a moment when no operation is running, and nothing in this system runs on its own. The fix is to stop thinking of it as a scheduled event and start thinking of it as a debt: it is owed at a known time, and it is paid the next time anyone looks.",
        "So: a min-heap of due cashbacks keyed by the moment they mature, and one _advance(timestamp) that pops everything due and credits it. Every single public operation calls _advance first — including the read-only ones, which is the half people forget. Then no method ever sees a stale balance.",
        "A heap rather than a scan because the only question ever asked is 'what is the earliest thing due', which is exactly what a heap answers in O(1) with O(log n) upkeep.",
        "Payment ids are global and ordinal — payment1, payment2 — across all accounts, so the counter lives on the system, not on the account. That same counter doubles as the heap's tie-breaker, which keeps two cashbacks maturing in the same millisecond deterministic.",
      ],
      design: [
        "An Account object now: balance, outgoing, and its payments. Three parallel dicts would work and would be worse.",
        "pending: a min-heap of (due_at, seq, account_id, payment_id, amount).",
        "_advance(timestamp) at the top of every operation. One line each, and it is the whole scheduler.",
        "Cashback is amount * 2 // 100 — integer floor, never round() and never a float.",
        "A payment is spending, so it adds to outgoing and shows up in TOP_SPENDERS.",
      ],
      code: `import heapq

CASHBACK_PERCENT = 2
CASHBACK_DELAY = 86_400_000                        # 24 hours, in milliseconds


class Account:
    def __init__(self, account_id):
        self.id = account_id
        self.balance = 0
        self.outgoing = 0                          # total money sent out
        self.payments = {}                         # payment_id -> cashback settled?


class BankingSystem:
    """Level 3 — payments that pay 2% back a day later."""

    def __init__(self):
        self.accounts = {}                         # account_id -> Account
        self.pending = []                          # min-heap of due cashbacks
        self.payment_count = 0

    # --- internals ------------------------------------------------------
    def _advance(self, timestamp):
        """Settle every cashback that has come due at or before \`timestamp\`.

        Called first by every operation, so the world is always up to date
        before anyone looks at it. Nothing runs in the background.
        """
        while self.pending and self.pending[0][0] <= timestamp:
            due_at, _, account_id, payment_id, amount = heapq.heappop(self.pending)
            account = self.accounts[account_id]
            account.balance += amount
            account.payments[payment_id] = True

    # --- operations -----------------------------------------------------
    def create_account(self, timestamp, account_id):
        self._advance(timestamp)
        if account_id in self.accounts:
            return False
        self.accounts[account_id] = Account(account_id)
        return True

    def deposit(self, timestamp, account_id, amount):
        self._advance(timestamp)
        account = self.accounts.get(account_id)
        if account is None:
            return None
        account.balance += amount
        return account.balance

    def transfer(self, timestamp, source_id, target_id, amount):
        self._advance(timestamp)
        source = self.accounts.get(source_id)
        target = self.accounts.get(target_id)
        if source is None or target is None or source is target:
            return None
        if source.balance < amount:
            return None
        source.balance -= amount
        target.balance += amount
        source.outgoing += amount
        return source.balance

    def top_spenders(self, timestamp, n):
        self._advance(timestamp)
        ranked = sorted(self.accounts.values(), key=lambda a: (-a.outgoing, a.id))
        return [f"{a.id}({a.outgoing})" for a in ranked[:n]]

    def pay(self, timestamp, account_id, amount):
        """Spend money outside the bank. Returns the payment id, or None."""
        self._advance(timestamp)
        account = self.accounts.get(account_id)
        if account is None or account.balance < amount:
            return None
        account.balance -= amount
        account.outgoing += amount                 # a payment is spending too
        self.payment_count += 1
        payment_id = f"payment{self.payment_count}"
        account.payments[payment_id] = False
        cashback = amount * CASHBACK_PERCENT // 100
        heapq.heappush(self.pending, (timestamp + CASHBACK_DELAY, self.payment_count,
                                      account_id, payment_id, cashback))
        return payment_id

    def get_payment_status(self, timestamp, account_id, payment_id):
        self._advance(timestamp)
        account = self.accounts.get(account_id)
        if account is None or payment_id not in account.payments:
            return None
        return "CASHBACK_RECEIVED" if account.payments[payment_id] else "IN_PROGRESS"`,
      trace: `D = 86,400,000 ms (24h)

DEPOSIT(2, "a", 2000)
PAY(3, "a", 1000)                     ->  "payment1"   balance 1000, cashback 20 due at 3+D
GET_PAYMENT_STATUS(4, "a", "payment1")      ->  "IN_PROGRESS"
GET_PAYMENT_STATUS(3+D-1, "a", "payment1")  ->  "IN_PROGRESS"
GET_PAYMENT_STATUS(3+D, "a", "payment1")    ->  "CASHBACK_RECEIVED"
balance at 3+D                              ->  1020

And the cashback is real money:
DEPOSIT(1, "x", 100); PAY(1, "x", 100)   ->  balance 0, 2 due at 1+D
PAY(2, "x", 1)       ->  None      (nothing there yet)
PAY(1+D, "x", 2)     ->  "payment2" (the cashback landed first)`,
      pitfalls: [
        "Settling cashback only in the operations that change money, so a status query or a balance read returns a stale number.",
        "Rounding cashback instead of flooring it, or letting a float in.",
        "Numbering payments per account, so two accounts both have a \"payment1\".",
        "Forgetting that a payment counts as spending for the level-2 leaderboard.",
        "A heap of (due_at, account_id) that raises when two cashbacks share a timestamp and the next field is not comparable — carry the ordinal.",
      ],
    },
    {
      n: 4,
      name: "Merging accounts, and the balance back then",
      minutes: "25–30 min",
      ops: [
        ["MERGE_ACCOUNTS(timestamp, id1, id2)", "Fold id2 into id1: balances and totals add, payments follow, id2 stops existing. False if either is missing or they are the same."],
        ["GET_BALANCE(timestamp, account_id, time_at)", "The balance that account had at time_at, or nothing if it did not exist then."],
      ],
      idea: [
        "A historical read only works if every balance change was recorded when it happened. One _set_balance(account, timestamp, balance) that appends to a per-account list is the whole mechanism — and the list is sorted by construction, so the query is a bisect, not a scan.",
        "The trap is the delayed cashback. It is credited by _advance whenever someone next looks, but it belongs in history at the moment it came due. Record it at due_at, not at the timestamp of the operation that happened to trigger it, or every historical query after a payment is wrong.",
        "Merging is a union-find in miniature: id2 keeps its record for historical queries but points at id1 through merged_into, and a pending cashback resolves through that pointer when it matures. A merged id is not deleted — it is closed, at a known moment.",
        "So an id has three states, not two: never existed, exists, and existed until it was merged. GET_BALANCE answers for the third one only for times before the merge — which is exactly the boundary the tests probe.",
      ],
      design: [
        "history: [(timestamp, balance)] per account, append-only, and every write goes through _set_balance.",
        "bisect_right(history, (time_at, inf)) - 1 finds the last entry at or before time_at, including ties at the same millisecond.",
        "merged_into / merged_at on the account, with _root following the chain and _live rejecting a closed id.",
        "The merge keeps id1's history continuous: the combined balance is written as a new entry at the merge timestamp.",
        "Payments move onto id1, so their status stays queryable — through the surviving id, not the closed one.",
      ],
      code: `import bisect
import heapq

CASHBACK_PERCENT = 2
CASHBACK_DELAY = 86_400_000                        # 24 hours, in milliseconds


class Account:
    def __init__(self, account_id, timestamp):
        self.id = account_id
        self.balance = 0
        self.outgoing = 0                          # total money sent out
        self.payments = {}                         # payment_id -> cashback settled?
        self.created_at = timestamp
        self.history = [(timestamp, 0)]            # (timestamp, balance) after each change
        self.merged_into = None                    # the id that absorbed this one
        self.merged_at = None                      # when that happened


class BankingSystem:
    """Level 4 — merging accounts, and reading a balance as of any past moment."""

    def __init__(self):
        self.accounts = {}                         # account_id -> Account
        self.pending = []                          # min-heap of due cashbacks
        self.payment_count = 0

    # --- internals ------------------------------------------------------
    def _root(self, account_id):
        """Follow the merge chain to the account that holds the money today."""
        account = self.accounts.get(account_id)
        while account is not None and account.merged_into is not None:
            account = self.accounts[account.merged_into]
        return account

    def _set_balance(self, account, timestamp, balance):
        """Every balance change goes through here, so history stays complete."""
        account.balance = balance
        account.history.append((timestamp, balance))

    def _live(self, account_id):
        """The account under this id, or None once the id has been merged away."""
        account = self.accounts.get(account_id)
        return None if account is None or account.merged_at is not None else account

    def _advance(self, timestamp):
        """Settle every cashback that has come due at or before \`timestamp\`.

        Called first by every operation, so the world is always up to date
        before anyone looks at it. Nothing runs in the background.
        """
        while self.pending and self.pending[0][0] <= timestamp:
            due_at, _, account_id, payment_id, amount = heapq.heappop(self.pending)
            account = self._root(account_id)       # follow merges
            self._set_balance(account, due_at, account.balance + amount)
            account.payments[payment_id] = True

    # --- operations -----------------------------------------------------
    def create_account(self, timestamp, account_id):
        self._advance(timestamp)
        if account_id in self.accounts:
            return False
        self.accounts[account_id] = Account(account_id, timestamp)
        return True

    def deposit(self, timestamp, account_id, amount):
        self._advance(timestamp)
        account = self._live(account_id)
        if account is None:
            return None
        self._set_balance(account, timestamp, account.balance + amount)
        return account.balance

    def transfer(self, timestamp, source_id, target_id, amount):
        self._advance(timestamp)
        source = self._live(source_id)
        target = self._live(target_id)
        if source is None or target is None or source is target:
            return None
        if source.balance < amount:
            return None
        self._set_balance(source, timestamp, source.balance - amount)
        self._set_balance(target, timestamp, target.balance + amount)
        source.outgoing += amount
        return source.balance

    def top_spenders(self, timestamp, n):
        self._advance(timestamp)
        live = [a for a in self.accounts.values() if a.merged_at is None]
        ranked = sorted(live, key=lambda a: (-a.outgoing, a.id))
        return [f"{a.id}({a.outgoing})" for a in ranked[:n]]

    def pay(self, timestamp, account_id, amount):
        """Spend money outside the bank. Returns the payment id, or None."""
        self._advance(timestamp)
        account = self._live(account_id)
        if account is None or account.balance < amount:
            return None
        self._set_balance(account, timestamp, account.balance - amount)
        account.outgoing += amount                 # a payment is spending too
        self.payment_count += 1
        payment_id = f"payment{self.payment_count}"
        account.payments[payment_id] = False
        cashback = amount * CASHBACK_PERCENT // 100
        heapq.heappush(self.pending, (timestamp + CASHBACK_DELAY, self.payment_count,
                                      account_id, payment_id, cashback))
        return payment_id

    def get_payment_status(self, timestamp, account_id, payment_id):
        self._advance(timestamp)
        account = self._live(account_id)
        if account is None or payment_id not in account.payments:
            return None
        return "CASHBACK_RECEIVED" if account.payments[payment_id] else "IN_PROGRESS"

    def merge_accounts(self, timestamp, id1, id2):
        """Fold id2 into id1. id2 stops existing; id1 keeps everything."""
        self._advance(timestamp)
        if id1 == id2:
            return False
        first, second = self._live(id1), self._live(id2)
        if first is None or second is None:
            return False
        self._set_balance(first, timestamp, first.balance + second.balance)
        first.outgoing += second.outgoing
        first.payments.update(second.payments)     # ids stay queryable on id1
        self._set_balance(second, timestamp, 0)
        second.merged_into = id1
        second.merged_at = timestamp
        return True

    def get_balance(self, timestamp, account_id, time_at):
        """The balance this account had at time_at, or None if it had none."""
        self._advance(timestamp)
        account = self.accounts.get(account_id)
        if account is None or time_at < account.created_at:
            return None
        if account.merged_at is not None and time_at >= account.merged_at:
            return None                            # the id was gone by then
        i = bisect.bisect_right(account.history, (time_at, float("inf"))) - 1
        return account.history[i][1] if i >= 0 else None`,
      trace: `t=10 CREATE_ACCOUNT(10, "a");  t=20 DEPOSIT 100;  t=30 DEPOSIT 50
GET_BALANCE(99, "a", 5)    ->  None   (before it existed)
GET_BALANCE(99, "a", 25)   ->  100
GET_BALANCE(99, "a", 30)   ->  150

Merging (a keeps 150, b keeps 150 and has spent 50)
MERGE_ACCOUNTS(5, "a", "b")  ->  True
DEPOSIT(7, "b", 1)           ->  None    ("b" is closed)
balance of "a"               ->  300
TOP_SPENDERS(8, 5)           ->  ["a(50)"]   (b's spending came along)
GET_BALANCE(9, "b", 4)       ->  150     (b's past is still readable)
GET_BALANCE(9, "b", 5)       ->  None    (and stops at the merge)

A cashback in flight follows the merge:
PAY(2, "b", 500) then MERGE_ACCOUNTS(3, "a", "b")
GET_PAYMENT_STATUS(4, "a", "payment1")  ->  "IN_PROGRESS"
GET_PAYMENT_STATUS(4, "b", "payment1")  ->  None
balance of "a" at 2+D                   ->  510`,
      pitfalls: [
        "Recording a cashback in history at observation time instead of its due time.",
        "Deleting the merged account, which throws away the history the spec still asks about.",
        "Leaving a merged account in TOP_SPENDERS, so its spending is counted twice.",
        "Dropping a cashback that was pending for the account that got merged away.",
        "Scanning the history list instead of bisecting it — correct, but it is the one place where the complexity question gets asked.",
      ],
    },
  ],
},

{
  id: "database",
  name: "In-memory database",
  tag: "the same ladder, new nouns",
  blurb: "A key/field store with ordered scans, expiring fields, and point-in-time backups you can restore into.",
  story:
    "Read this one after the file store and the shape should feel familiar before you have finished the " +
    "page: CRUD, then a query, then TTLs, then history. Recognising the ladder is the skill — by level 1 " +
    "you already know a record needs somewhere to keep an expiry, and by level 3 you know the backup is coming.",
  structures: ["dict", "bisect", "str"],
  patterns: ["hash-map-seen", "binary-search-index"],
  levels: [
    {
      n: 1,
      name: "Set, get, delete",
      minutes: "10 min",
      ops: [
        ["SET(key, field, value)", "Insert or overwrite one field of one record."],
        ["GET(key, field)", "The value, or nothing when the key or the field is missing."],
        ["DELETE(key, field)", "True when something was actually removed."],
      ],
      idea: [
        "A dict of dicts. setdefault(key, {}) creates the record on first write, and .get(key, {}).get(field) reads through both levels without a single if.",
        "The one decision worth making deliberately: when the last field of a record goes, the record goes too. It costs two lines now and keeps the level-4 'how many keys' count honest.",
      ],
      design: [
        "key -> {field: value}, nested plain dicts.",
        "Delete removes the empty parent — no empty records left behind.",
        "Delete returns a bool, get returns the value or None. Do not unify them.",
      ],
      code: `class Database:
    """Level 1 — a two-level store: key -> field -> value."""

    def __init__(self):
        self.db = {}                               # key -> {field: value}

    def set(self, key, field, value):
        """Insert or overwrite one field of one record."""
        self.db.setdefault(key, {})[field] = value

    def get(self, key, field):
        """The value, or None when the key or the field is missing."""
        return self.db.get(key, {}).get(field)

    def delete(self, key, field):
        """True when something was actually removed."""
        record = self.db.get(key)
        if record is None or field not in record:
            return False
        del record[field]
        if not record:
            del self.db[key]                       # never keep an empty key around
        return True`,
      trace: `SET("u1", "name", "ana")
SET("u1", "age", "30")
GET("u1", "name")      ->  "ana"
GET("u1", "email")     ->  None
GET("ghost", "name")   ->  None
DELETE("u1", "age")    ->  True
DELETE("u1", "age")    ->  False`,
      pitfalls: [
        "db[key][field] straight out, which raises on a missing key instead of returning None.",
        "Leaving an empty dict behind after the last delete.",
        "Returning None from delete where the spec asks for False.",
      ],
    },
    {
      n: 2,
      name: "Ordered scans",
      minutes: "10–15 min",
      ops: [
        ["SCAN(key)", "Every field of the record as \"field(value)\", in field order."],
        ["SCAN_BY_PREFIX(key, prefix)", "The same, restricted to fields starting with prefix."],
      ],
      idea: [
        "Both operations are one function with a different filter — and SCAN is SCAN_BY_PREFIX with the empty prefix. Writing it once is not tidiness; it is the reason level 3, which rewrites the scan entirely, is one edit instead of two.",
        "Order is by field name, so sorted() on the keys. A record has few fields, so nothing more elaborate earns its place here.",
      ],
      design: [
        "One private _scan(key, prefix); the two public methods are one line each.",
        "sorted(record) sorts the keys — no need to spell out .keys().",
        "A missing key scans to an empty list, not an error.",
      ],
      code: `class Database:
    """Level 2 — level 1, plus ordered scans of a record."""

    def __init__(self):
        self.db = {}                               # key -> {field: value}

    def set(self, key, field, value):
        """Insert or overwrite one field of one record."""
        self.db.setdefault(key, {})[field] = value

    def get(self, key, field):
        """The value, or None when the key or the field is missing."""
        return self.db.get(key, {}).get(field)

    def delete(self, key, field):
        """True when something was actually removed."""
        record = self.db.get(key)
        if record is None or field not in record:
            return False
        del record[field]
        if not record:
            del self.db[key]                       # never keep an empty key around
        return True

    def scan(self, key):
        """Every field of the record as "field(value)", in field order."""
        return self._scan(key, "")

    def scan_by_prefix(self, key, prefix):
        """The same, restricted to fields starting with prefix."""
        return self._scan(key, prefix)

    # One private scanner behind both entry points: the only difference is
    # the filter, and the level 3 rewrite then only has to happen once.
    def _scan(self, key, prefix):
        record = self.db.get(key, {})
        return [f"{field}({record[field]})"
                for field in sorted(record) if field.startswith(prefix)]`,
      trace: `record u1: {name: ana, age: 30, nickname: an}

SCAN("u1")                   ->  ["age(30)", "name(ana)", "nickname(an)"]
SCAN_BY_PREFIX("u1", "n")    ->  ["name(ana)", "nickname(an)"]
SCAN("ghost")                ->  []`,
      pitfalls: [
        "Returning insertion order instead of sorted field order.",
        "Duplicating the body in both methods, then fixing a level-3 bug in only one of them.",
        "Formatting as \"field: value\" — the string shape is graded.",
      ],
    },
    {
      n: 3,
      name: "Expiring fields",
      minutes: "20 min",
      ops: [
        ["SET_AT(timestamp, key, field, value, ttl?)", "With a ttl, the field dies at timestamp + ttl."],
        ["GET_AT / DELETE_AT (timestamp, …)", "An expired field is indistinguishable from a missing one."],
        ["SCAN_AT / SCAN_BY_PREFIX_AT (timestamp, …)", "Scans see only what is alive at that moment."],
      ],
      idea: [
        "The same move as the file store: the value becomes (value, expires_at), the expiry is absolute, and one _alive(key, field, at) helper answers every liveness question. Level 3 stops being a rewrite and becomes a change of shape in one place.",
        "Expired entries are not removed, just ignored — a lazy sweep. It is the right call at this size, and the sentence to say out loud is that memory grows with dead fields until something touches them, which a real implementation would fix with an expiry heap.",
        "Overwriting a field replaces its expiry too, which is what makes SET_AT on a field with a ttl and no ttl behave the way the tests expect.",
      ],
      design: [
        "key -> {field: (value, expires_at)}, expires_at None meaning forever.",
        "_alive() is the only place that compares against a timestamp.",
        "Expiry is exclusive: alive for t .. t+ttl-1, gone at t+ttl.",
        "The level 1 and 2 methods stay as wrappers at timestamp 0.",
      ],
      code: `class Database:
    """Level 3 — every operation happens at a timestamp; fields may expire."""

    def __init__(self):
        self.db = {}                               # key -> {field: (value, expires_at)}

    # --- internals ------------------------------------------------------
    def _alive(self, key, field, at):
        """The value of key.field at time \`at\`, or None if missing/expired."""
        record = self.db.get(key)
        if record is None or field not in record:
            return None
        value, expires_at = record[field]
        if expires_at is not None and at >= expires_at:
            return None
        return value

    # --- timestamped operations -----------------------------------------
    def set_at(self, timestamp, key, field, value, ttl=None):
        expires_at = None if ttl is None else timestamp + ttl
        self.db.setdefault(key, {})[field] = (value, expires_at)

    def get_at(self, timestamp, key, field):
        return self._alive(key, field, timestamp)

    def delete_at(self, timestamp, key, field):
        if self._alive(key, field, timestamp) is None:
            return False                           # missing, or already expired
        del self.db[key][field]
        if not self.db[key]:
            del self.db[key]
        return True

    def scan_at(self, timestamp, key):
        return self._scan_at(timestamp, key, "")

    def scan_by_prefix_at(self, timestamp, key, prefix):
        return self._scan_at(timestamp, key, prefix)

    def _scan_at(self, timestamp, key, prefix):
        record = self.db.get(key, {})
        out = []
        for field in sorted(record):
            if not field.startswith(prefix):
                continue
            value = self._alive(key, field, timestamp)
            if value is not None:                  # expired fields are invisible
                out.append(f"{field}({value})")
        return out

    # --- level 1 & 2 operations, still working --------------------------
    def set(self, key, field, value):
        self.set_at(0, key, field, value)

    def get(self, key, field):
        return self.get_at(0, key, field)

    def delete(self, key, field):
        return self.delete_at(0, key, field)

    def scan(self, key):
        return self.scan_at(0, key)

    def scan_by_prefix(self, key, prefix):
        return self.scan_by_prefix_at(0, key, prefix)`,
      trace: `SET_AT(1, "k", "a", "1", ttl=5)   ->  alive for t = 1 .. 5
SET_AT(1, "k", "b", "2")          ->  forever
GET_AT(5, "k", "a")    ->  "1"
GET_AT(6, "k", "a")    ->  None
SCAN_AT(5, "k")        ->  ["a(1)", "b(2)"]
SCAN_AT(6, "k")        ->  ["b(2)"]
DELETE_AT(6, "k", "a") ->  False    (already expired — nothing to delete)

Overwriting clears the old ttl:
SET_AT(1, "k2", "f", "x", ttl=2)
SET_AT(2, "k2", "f", "y")
GET_AT(100, "k2", "f") ->  "y"`,
      pitfalls: [
        "Deleting an expired field and returning True — it was already gone.",
        "Keeping the ttl instead of the expiry, and needing the write time everywhere.",
        "Scanning the raw dict so dead fields still show up.",
        "Using None as a sentinel for 'missing' when None is also a legal value — here values are strings, so it is safe; say so rather than assuming it.",
      ],
    },
    {
      n: 4,
      name: "Backup and restore",
      minutes: "25 min",
      ops: [
        ["BACKUP(timestamp)", "Snapshot the database. Returns how many non-empty keys were saved."],
        ["RESTORE(timestamp, from_timestamp)", "Reinstate the newest backup taken at or before from_timestamp. Restored fields start their remaining life again from timestamp."],
      ],
      idea: [
        "The whole level turns on one choice: a backup stores each field's remaining life, not its absolute expiry. Save what is left and a restore at any later moment comes out right on its own; save the absolute time and every restore needs a correction you will get the sign of wrong at least once.",
        "Backups are appended in timestamp order, so 'the newest backup at or before from_timestamp' is a bisect over their timestamps — the same lookup as the banking history, on a different list.",
        "A restore replaces the database wholesale rather than merging into it: anything created after the backup is meant to disappear. Build a fresh dict rather than clearing and re-filling the old one.",
        "Fields that had already expired when the backup was taken are not saved, which also makes the returned count — non-empty keys only — fall out for free.",
      ],
      design: [
        "backups: [(timestamp, snapshot)] plus a parallel list of timestamps for bisect (tuples holding dicts are not comparable).",
        "The snapshot holds (value, remaining) with remaining = expires_at - backup_time, or None.",
        "On restore, expires_at = timestamp + remaining — remaining life re-based to now.",
        "A restore with no backup at or before the target is a no-op, not an error.",
      ],
      code: `import bisect


class Database:
    """Level 4 — point-in-time backups that restore with TTLs intact."""

    def __init__(self):
        self.db = {}                               # key -> {field: (value, expires_at)}
        self.backups = []                          # [(timestamp, snapshot), ...]
        self.backup_times = []                     # the same timestamps, for bisect

    # --- internals ------------------------------------------------------
    def _alive(self, key, field, at):
        """The value of key.field at time \`at\`, or None if missing/expired."""
        record = self.db.get(key)
        if record is None or field not in record:
            return None
        value, expires_at = record[field]
        if expires_at is not None and at >= expires_at:
            return None
        return value

    # --- timestamped operations -----------------------------------------
    def set_at(self, timestamp, key, field, value, ttl=None):
        expires_at = None if ttl is None else timestamp + ttl
        self.db.setdefault(key, {})[field] = (value, expires_at)

    def get_at(self, timestamp, key, field):
        return self._alive(key, field, timestamp)

    def delete_at(self, timestamp, key, field):
        if self._alive(key, field, timestamp) is None:
            return False                           # missing, or already expired
        del self.db[key][field]
        if not self.db[key]:
            del self.db[key]
        return True

    def scan_at(self, timestamp, key):
        return self._scan_at(timestamp, key, "")

    def scan_by_prefix_at(self, timestamp, key, prefix):
        return self._scan_at(timestamp, key, prefix)

    def _scan_at(self, timestamp, key, prefix):
        record = self.db.get(key, {})
        out = []
        for field in sorted(record):
            if not field.startswith(prefix):
                continue
            value = self._alive(key, field, timestamp)
            if value is not None:                  # expired fields are invisible
                out.append(f"{field}({value})")
        return out

    def backup(self, timestamp):
        """Snapshot every live field, storing the life each one has LEFT.

        Storing what remains rather than the absolute expiry is what makes a
        restore at any later moment come out right.
        """
        snapshot = {}
        for key, record in self.db.items():
            kept = {}
            for field, (value, expires_at) in record.items():
                if expires_at is not None and timestamp >= expires_at:
                    continue                       # already expired: do not save it
                remaining = None if expires_at is None else expires_at - timestamp
                kept[field] = (value, remaining)
            if kept:
                snapshot[key] = kept
        self.backups.append((timestamp, snapshot))
        self.backup_times.append(timestamp)
        return len(snapshot)                       # non-empty keys saved

    def restore(self, timestamp, from_timestamp):
        """Reinstate the newest backup taken at or before from_timestamp.

        Each restored field starts its remaining life again from \`timestamp\`.
        """
        i = bisect.bisect_right(self.backup_times, from_timestamp) - 1
        if i < 0:
            return                                 # nothing was ever backed up
        snapshot = self.backups[i][1]
        self.db = {
            key: {field: (value, None if remaining is None else timestamp + remaining)
                  for field, (value, remaining) in record.items()}
            for key, record in snapshot.items()
        }

    # --- level 1 & 2 operations, still working --------------------------
    def set(self, key, field, value):
        self.set_at(0, key, field, value)

    def get(self, key, field):
        return self.get_at(0, key, field)

    def delete(self, key, field):
        return self.delete_at(0, key, field)

    def scan(self, key):
        return self.scan_at(0, key)

    def scan_by_prefix(self, key, prefix):
        return self.scan_by_prefix_at(0, key, prefix)`,
      trace: `t=1  SET_AT(1, "k1", "f1", "v1")
     SET_AT(1, "k1", "f2", "v2", ttl=10)   ->  dies at t=11
     SET_AT(1, "k2", "f1", "v3")
t=2  BACKUP(2)         ->  2      (k1 and k2; f2 has 9 ticks left)
t=3  SET_AT(3, "k3", "f1", "v4");  DELETE_AT(3, "k1", "f1")

t=100 RESTORE(100, 50)   ->  the t=2 backup
      keys now: k1, k2        (k3 was never in it)
      GET_AT(100, "k1", "f1") ->  "v1"   (the delete is undone)
      GET_AT(108, "k1", "f2") ->  "v2"   (9 ticks from t=100)
      GET_AT(109, "k1", "f2") ->  None

RESTORE(12, 0)  ->  older than every backup: nothing happens`,
      pitfalls: [
        "Saving the absolute expiry, so everything in a backup restored much later is dead on arrival.",
        "Restoring the newest backup instead of the newest one at or before from_timestamp.",
        "Merging the snapshot into the live database instead of replacing it.",
        "Storing the snapshot by reference — the nested dicts must be copied, or later writes mutate the backup.",
        "Counting keys that only held expired fields.",
      ],
    },
  ],
},

];
