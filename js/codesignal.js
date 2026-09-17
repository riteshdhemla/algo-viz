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
    "An industry coding assessment is not a puzzle. It is one small system — a file store, a bank, a " +
    "database, a scheduler — specified in four levels, each one landing on the code you already wrote. Nothing " +
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
    "The nouns change between challenges. The ladder mostly does not: state, then a ranked query over " +
    "that state, then time, then history. Recognising which rung you are on tells you what to build " +
    "before you have read the whole page. Mostly — the hotel below shifts a rung, because its data is " +
    "an interval and time therefore arrives at level 2. Treat the ladder as the shape to expect and " +
    "then check, not as a promise.",
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
  id: "filesystem",
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
  id: "bank",
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
  id: "imdb",
  name: "In-memory database",
  tag: "scans and backups",
  blurb: "A key/field store with ordered scans, expiring fields, and point-in-time backups you can restore into.",
  story:
    "Read this one straight after the file store and the shape should feel familiar before you have " +
    "finished the page: CRUD, then a query, then TTLs, then history, with nothing but the nouns changed. " +
    "Recognising the ladder is the skill — by level 1 you already know a record needs somewhere to keep " +
    "an expiry, and by level 3 you know the backup is coming.",
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

{
  id: "kvstore",
  name: "Key-value store with transactions",
  tag: "begin · commit · rollback",
  blurb: "Set, get and delete; then an index over the values, nested transactions you can roll back, and keys that expire.",
  story:
    "The one challenge in the set where the level-4 requirement can invalidate a level-2 decision. " +
    "Transactions want state you can throw away wholesale; the value index wants state you maintain " +
    "incrementally; TTLs want state nobody has to maintain at all. Reconciling those three is the " +
    "whole exercise, and the answer involves deleting code you were right to write earlier.",
  structures: ["dict", "counter", "list"],
  patterns: ["hash-map-seen"],
  levels: [
    {
      n: 1,
      name: "Set, get, delete",
      minutes: "5–10 min",
      ops: [
        ["SET(key, value)", "Insert or overwrite. Always succeeds."],
        ["GET(key)", "The value, or nothing when the key is absent."],
        ["DELETE(key)", "True when the key was there to remove."],
      ],
      idea: [
        "One dictionary. This level exists to give level 3 something to be a transaction over, so the only thing to get right is the return types — a bool from delete, the value or None from get.",
        "Spend the time you save reading level 3. If you know transactions are coming, you will not be tempted to sprinkle self.data[...] across eight methods, and that is worth more than anything you could do here.",
      ],
      design: [
        "key -> value in a plain dict. Nothing else earns its place yet.",
        "delete returns a bool; get returns the value or None. Do not collapse them.",
        "Overwrite is legal and silent — set never fails.",
      ],
      code: `class KVStore:
    """Level 1 — a flat key -> value store."""

    def __init__(self):
        self.data = {}                             # key -> value

    def set(self, key, value):
        """Insert or overwrite. Always succeeds."""
        self.data[key] = value

    def get(self, key):
        """The value, or None when the key is not there."""
        return self.data.get(key)

    def delete(self, key):
        """True when the key was there to remove."""
        if key not in self.data:
            return False
        del self.data[key]
        return True`,
      trace: `SET("a", "x")
GET("a")       ->  "x"
GET("zz")      ->  None
DELETE("a")    ->  True
DELETE("a")    ->  False`,
      pitfalls: [
        "Returning the deleted value from delete when the spec asks for a bool.",
        "Raising on an absent key instead of returning None.",
        "Refusing to overwrite — set is not an insert.",
      ],
    },
    {
      n: 2,
      name: "An index over the values",
      minutes: "10–15 min",
      ops: [
        ["COUNT_BY_VALUE(value)", "How many keys currently hold this value."],
        ["TOP_VALUES(n)", "The n most common values, as \"value(count)\". Most first, ties by value ascending."],
      ],
      idea: [
        "Counting by scanning every key on each query is correct and, at this size, fine. Maintaining a tally on write is better and barely longer — one _bump(value, delta) helper called from set and delete.",
        "The bug this level is built around: overwriting a key has to release the OLD value's count before claiming the new one. Every incremental index has this shape, and forgetting the release is the single most common way to fail this level.",
        "Drop a value from the tally when it reaches zero rather than leaving a 0 behind, or it shows up in TOP_VALUES with a count of nothing.",
      ],
      design: [
        "counts: value -> how many keys hold it, maintained on every write.",
        "One _bump() so the release-then-claim order exists in exactly one place.",
        "sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])) — count descending, value ascending.",
      ],
      code: `class KVStore:
    """Level 2 — level 1, plus an index over the values."""

    def __init__(self):
        self.data = {}                             # key -> value
        self.counts = {}                           # value -> how many keys hold it

    # --- internals ------------------------------------------------------
    def _bump(self, value, delta):
        """Move a value's tally, dropping it when it reaches zero."""
        total = self.counts.get(value, 0) + delta
        if total:
            self.counts[value] = total
        else:
            self.counts.pop(value, None)

    # --- operations -----------------------------------------------------
    def set(self, key, value):
        """Insert or overwrite. Overwriting releases the OLD value's count."""
        if key in self.data:
            self._bump(self.data[key], -1)
        self.data[key] = value
        self._bump(value, 1)

    def get(self, key):
        return self.data.get(key)

    def delete(self, key):
        if key not in self.data:
            return False
        self._bump(self.data[key], -1)
        del self.data[key]
        return True

    def count_by_value(self, value):
        """How many keys currently hold this value."""
        return self.counts.get(value, 0)

    def top_values(self, n):
        """The n most common values, as "value(count)".

        Most first; ties broken by the value itself, ascending.
        """
        ranked = sorted(self.counts.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{value}({count})" for value, count in ranked[:n]]`,
      trace: `SET("a","x"); SET("b","x"); SET("c","y")
COUNT_BY_VALUE("x")   ->  2
TOP_VALUES(2)         ->  ["x(2)", "y(1)"]

SET("a", "y")             # the overwrite must release "x"
COUNT_BY_VALUE("x")   ->  1
COUNT_BY_VALUE("y")   ->  2
TOP_VALUES(5)         ->  ["y(2)", "x(1)"]

DELETE("a"); DELETE("b"); DELETE("c")
TOP_VALUES(3)         ->  []          # no zero-count ghosts`,
      pitfalls: [
        "Overwriting a key without decrementing the value it used to hold.",
        "Leaving zero-count entries in the tally, so they surface in the ranking.",
        "Counting keys instead of values, or values instead of keys — read the sentence twice.",
      ],
    },
    {
      n: 3,
      name: "Nested transactions",
      minutes: "25–30 min",
      ops: [
        ["BEGIN()", "Open a transaction. They nest."],
        ["ROLLBACK()", "Discard the innermost open transaction. False when none is open."],
        ["COMMIT()", "Make every open transaction permanent. False when none is open."],
      ],
      idea: [
        "Do not try to undo writes. Store them somewhere you can drop: the store becomes a stack of layers, layer 0 is committed state, and every BEGIN pushes another. A read walks down from the top and stops at the first layer with an opinion about the key — so ROLLBACK is a single pop, and there is nothing to reverse.",
        "A delete inside a transaction is not an absence, it is a fact: 'deleted here'. That needs a tombstone sentinel, because an absent key in the top layer means 'no opinion, keep looking down' and those are different answers.",
        "The level-2 index is what makes this interesting. A count is not a value you can shadow — it is an aggregate over all layers. Store count deltas per layer and sum them on read, and the tally unwinds with the layer that created it, for free.",
        "COMMIT here applies every open transaction, and ROLLBACK undoes only the innermost. That asymmetry is a real convention, not an oversight — but the other convention (commit merges one level down into its parent) is equally common, so this is a question to ask rather than an assumption to make.",
      ],
      design: [
        "layers: a list of {data, counts}; layers[0] is committed, one more per open transaction.",
        "TOMBSTONE = object() — a unique sentinel, never None, because None is a legal absence.",
        "Count deltas live in the layer that made them; the effective count sums across layers.",
        "COMMIT flattens into the base and turns tombstones into real deletions, so the base never holds one.",
        "ROLLBACK/COMMIT with nothing open returns False rather than raising.",
      ],
      code: `TOMBSTONE = object()                               # "deleted in this layer"


class KVStore:
    """Level 3 — nested transactions, as a stack of write layers.

    layers[0] is committed state; every open transaction pushes one more.
    A read walks down from the top and stops at the first layer that has
    an opinion about the key, so a rollback is a pop and nothing else.
    """

    def __init__(self):
        self.layers = [{"data": {}, "counts": {}}]

    # --- internals ------------------------------------------------------
    @property
    def _top(self):
        return self.layers[-1]

    def _bump(self, value, delta):
        """Count deltas live in the layer that made them, so they unwind too."""
        counts = self._top["counts"]
        counts[value] = counts.get(value, 0) + delta

    def _totals(self):
        """The effective value tally: every layer's deltas summed."""
        totals = {}
        for layer in self.layers:
            for value, delta in layer["counts"].items():
                totals[value] = totals.get(value, 0) + delta
        return {value: n for value, n in totals.items() if n > 0}

    # --- operations -----------------------------------------------------
    def set(self, key, value):
        old = self.get(key)
        if old is not None:
            self._bump(old, -1)
        self._top["data"][key] = value
        self._bump(value, 1)

    def get(self, key):
        for layer in reversed(self.layers):
            if key in layer["data"]:
                found = layer["data"][key]
                return None if found is TOMBSTONE else found
        return None

    def delete(self, key):
        old = self.get(key)
        if old is None:
            return False
        self._bump(old, -1)
        self._top["data"][key] = TOMBSTONE
        return True

    def count_by_value(self, value):
        return self._totals().get(value, 0)

    def top_values(self, n):
        ranked = sorted(self._totals().items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{value}({count})" for value, count in ranked[:n]]

    # --- transactions ---------------------------------------------------
    def begin(self):
        """Open a transaction. They nest."""
        self.layers.append({"data": {}, "counts": {}})

    def rollback(self):
        """Discard the innermost open transaction. False if none is open."""
        if len(self.layers) == 1:
            return False
        self.layers.pop()
        return True

    def commit(self):
        """Make every open transaction permanent. False if none is open."""
        if len(self.layers) == 1:
            return False
        base = self.layers[0]
        for layer in self.layers[1:]:
            for key, found in layer["data"].items():
                if found is TOMBSTONE:
                    base["data"].pop(key, None)
                else:
                    base["data"][key] = found
            for value, delta in layer["counts"].items():
                base["counts"][value] = base["counts"].get(value, 0) + delta
        base["counts"] = {v: n for v, n in base["counts"].items() if n > 0}
        self.layers = [base]
        return True`,
      trace: `SET("a","x")            layers: [ {a:x} ]
BEGIN()                 layers: [ {a:x}, {} ]
SET("a","y")            layers: [ {a:x}, {a:y} ]
GET("a")           ->   "y"        # the top layer with an opinion wins
COUNT_BY_VALUE("x")->   0          # deltas sum: +1 then -1
ROLLBACK()         ->   True
GET("a")           ->   "x"
COUNT_BY_VALUE("x")->   1          # the delta left with its layer
ROLLBACK()         ->   False

Nesting peels one layer at a time:
SET("a","0"); BEGIN; SET("a","1"); BEGIN; SET("a","2")
GET("a") -> "2";  ROLLBACK -> "1";  ROLLBACK -> "0"

COMMIT closes everything at once:
BEGIN; SET("a","1"); BEGIN; DELETE("a"); COMMIT() -> True
GET("a")     ->  None
ROLLBACK()   ->  False     # there is nothing left open`,
      pitfalls: [
        "Using None as the deleted marker, so 'deleted in this layer' is indistinguishable from 'not mentioned in this layer'.",
        "Rolling back the data but not the value index — the counts then describe a world that no longer exists.",
        "Committing a tombstone into the base, so the key reads as present-but-deleted forever after.",
        "Assuming COMMIT closes only the innermost transaction. Ask which convention is wanted; both are common.",
        "Raising instead of returning False when no transaction is open.",
      ],
    },
    {
      n: 4,
      name: "Keys that expire",
      minutes: "20–25 min",
      ops: [
        ["SET_AT(timestamp, key, value, ttl?)", "With a ttl the key dies at timestamp + ttl."],
        ["GET_AT / DELETE_AT / COUNT_BY_VALUE_AT / TOP_VALUES_AT", "The same operations, asked as of a moment."],
      ],
      idea: [
        "The value becomes (value, expires_at) and liveness is one comparison on read — by now a reflex. The interesting part is what a TTL does to the level-2 index, and the answer is: it destroys it.",
        "An incrementally maintained tally needs a moment at which to decrement. Expiry has no such moment — nothing runs when a key dies, and the layer that wrote it is long gone. There is no patch for this; the tally is unmaintainable in principle, not by accident.",
        "So the index comes out, and the counts are computed from the live view instead. That is O(n) per query rather than O(1), and it is the right trade: correct and obvious beats fast and quietly wrong. Being willing to delete a level-2 optimisation that level 4 has invalidated is the skill this level is testing.",
        "Transactions and TTLs then compose without any special handling, because expiries are absolute. A rolled-back write never existed, deadline and all; a committed write keeps the deadline it was given when it was written, not the moment it landed.",
      ],
      design: [
        "Layers hold key -> (value, expires_at) | TOMBSTONE; the per-layer count deltas are gone.",
        "_view(at) flattens the layers top-down and drops anything expired; the counts are derived from it.",
        "Expiry is exclusive: alive for t .. t+ttl-1, gone at t+ttl.",
        "COMMIT copies records verbatim — no deadline rebasing, because they were never relative.",
        "The level 1 and 2 methods stay as wrappers at timestamp 0.",
      ],
      code: `TOMBSTONE = object()                               # "deleted in this layer"


class KVStore:
    """Level 4 — transactions, now with keys that expire.

    The value index from level 2 is gone on purpose. An incrementally
    maintained tally cannot survive a TTL: nothing runs when a key expires,
    so there is no moment at which to decrement it. The counts are computed
    from the live view instead — O(n) per query, correct by construction.
    """

    def __init__(self):
        self.layers = [{}]                         # key -> (value, expires_at) | TOMBSTONE

    # --- internals ------------------------------------------------------
    @property
    def _top(self):
        return self.layers[-1]

    def _record(self, key):
        """The innermost layer's opinion about this key, or None."""
        for layer in reversed(self.layers):
            if key in layer:
                return layer[key]
        return None

    def _view(self, at):
        """Every key alive at \`at\`, flattened top-down across the layers."""
        view = {}
        for layer in self.layers:
            for key, record in layer.items():
                if record is TOMBSTONE:
                    view.pop(key, None)
                else:
                    view[key] = record
        return {key: value for key, (value, expires_at) in view.items()
                if expires_at is None or at < expires_at}

    def _totals(self, at):
        totals = {}
        for value in self._view(at).values():
            totals[value] = totals.get(value, 0) + 1
        return totals

    # --- timestamped operations -----------------------------------------
    def set_at(self, timestamp, key, value, ttl=None):
        expires_at = None if ttl is None else timestamp + ttl
        self._top[key] = (value, expires_at)

    def get_at(self, timestamp, key):
        record = self._record(key)
        if record is None or record is TOMBSTONE:
            return None
        value, expires_at = record
        return None if expires_at is not None and timestamp >= expires_at else value

    def delete_at(self, timestamp, key):
        if self.get_at(timestamp, key) is None:
            return False                           # missing, or already expired
        self._top[key] = TOMBSTONE
        return True

    def count_by_value_at(self, timestamp, value):
        return self._totals(timestamp).get(value, 0)

    def top_values_at(self, timestamp, n):
        ranked = sorted(self._totals(timestamp).items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{value}({count})" for value, count in ranked[:n]]

    # --- transactions ---------------------------------------------------
    def begin(self):
        """Open a transaction. They nest."""
        self.layers.append({})

    def rollback(self):
        """Discard the innermost open transaction. False if none is open."""
        if len(self.layers) == 1:
            return False
        self.layers.pop()
        return True

    def commit(self):
        """Make every open transaction permanent. False if none is open.

        Expiries are absolute, so a key written inside a transaction keeps
        the deadline it was given when it was written, not when it landed.
        """
        if len(self.layers) == 1:
            return False
        base = self.layers[0]
        for layer in self.layers[1:]:
            for key, record in layer.items():
                if record is TOMBSTONE:
                    base.pop(key, None)
                else:
                    base[key] = record
        self.layers = [base]
        return True

    # --- level 1 & 2 operations, still working --------------------------
    def set(self, key, value):
        self.set_at(0, key, value)

    def get(self, key):
        return self.get_at(0, key)

    def delete(self, key):
        return self.delete_at(0, key)

    def count_by_value(self, value):
        return self.count_by_value_at(0, value)

    def top_values(self, n):
        return self.top_values_at(0, n)`,
      trace: `SET_AT(1, "a", "x", ttl=5)      # alive for t = 1 .. 5
SET_AT(1, "b", "x")             # forever
COUNT_BY_VALUE_AT(5, "x")  ->  2
COUNT_BY_VALUE_AT(6, "x")  ->  1     # it stopped counting with nobody watching
DELETE_AT(6, "a")          ->  False # already gone

A rolled-back write never existed, deadline and all:
SET_AT(0, "a", "old")
BEGIN(); SET_AT(1, "a", "new", ttl=5)
GET_AT(2, "a")     ->  "new"
ROLLBACK()
GET_AT(100, "a")   ->  "old"

A committed write keeps the deadline it was GIVEN:
BEGIN(); SET_AT(10, "a", "x", ttl=5); COMMIT()
GET_AT(14, "a")    ->  "x"
GET_AT(15, "a")    ->  None`,
      pitfalls: [
        "Keeping the incremental tally and trying to patch it on expiry — there is no event to hang the patch on.",
        "Rebasing deadlines at commit time. The key dies when it was told to die, not 24 lines later.",
        "Letting an expired key still block a write or still answer a count.",
        "Deleting an expired key and reporting True.",
      ],
    },
  ],
},

{
  id: "scheduler",
  name: "Task / job scheduler",
  tag: "the simulation one",
  blurb: "Submit, inspect and cancel jobs; rank the queue; then run them on a pool of workers over simulated time, with dependencies.",
  story:
    "The only challenge here where level 3 is a simulation rather than a lookup. Nothing runs in the " +
    "background, so 'what is the status at t=7' means replaying the entire schedule up to t=7 — every " +
    "start, every completion, in order. Get that replay into one method and level 4 costs you a " +
    "predicate; spread it across the operations and level 4 is unreachable.",
  structures: ["heapq", "dict"],
  patterns: ["top-k-heap", "topo-sort"],
  levels: [
    {
      n: 1,
      name: "Submit, inspect, cancel",
      minutes: "10 min",
      ops: [
        ["SUBMIT(timestamp, job_id, priority)", "Register a job. False when the id is taken."],
        ["GET_STATUS(timestamp, job_id)", "PENDING / CANCELLED, or nothing for an unknown job."],
        ["CANCEL(timestamp, job_id)", "True only when a job that had not run yet was cancelled."],
      ],
      idea: [
        "A job has an id, a priority, a submission time and a status before you have written anything — four attributes on day one. That is the signal to make it a class immediately; it gains three more fields by level 4 and the shape never changes again.",
        "Statuses are a small closed set and every later level adds to it. Write them as plain strings matching the spec exactly, and let the status field be the single source of truth about a job — never a parallel 'cancelled' set that can disagree with it.",
      ],
      design: [
        "A Job class from level 1, not a tuple and not four parallel dicts.",
        "status is one field; every question about a job goes through it.",
        "Cancelling something that already ran is False, not an error.",
      ],
      code: `class Job:
    """A unit of work.

    It is a class from level 1, not an int, because a job already has three
    attributes — and levels 3 and 4 add four more without changing the shape.
    """

    def __init__(self, job_id, priority, submitted_at):
        self.id = job_id
        self.priority = priority
        self.submitted_at = submitted_at
        self.status = "PENDING"


class Scheduler:
    """Level 1 — register, inspect and cancel jobs."""

    def __init__(self):
        self.jobs = {}                             # job_id -> Job

    def submit(self, timestamp, job_id, priority):
        """False when the id is already taken."""
        if job_id in self.jobs:
            return False
        self.jobs[job_id] = Job(job_id, priority, timestamp)
        return True

    def get_status(self, timestamp, job_id):
        """PENDING / CANCELLED, or None when there is no such job."""
        job = self.jobs.get(job_id)
        return job.status if job is not None else None

    def cancel(self, timestamp, job_id):
        """True only when a job that had not run yet was actually cancelled."""
        job = self.jobs.get(job_id)
        if job is None or job.status != "PENDING":
            return False
        job.status = "CANCELLED"
        return True`,
      trace: `SUBMIT(1, "a", 5)        ->  True
SUBMIT(2, "a", 9)        ->  False     (id taken)
GET_STATUS(5, "a")       ->  "PENDING"
GET_STATUS(5, "ghost")   ->  None
CANCEL(6, "a")           ->  True
CANCEL(6, "a")           ->  False     (not pending any more)
GET_STATUS(7, "a")       ->  "CANCELLED"`,
      pitfalls: [
        "Keeping a separate set of cancelled ids alongside the status field, and letting the two drift.",
        "Returning True from cancel for an unknown job.",
        "Ignoring the timestamp argument so thoroughly that you drop it from the signature — level 3 needs it.",
      ],
    },
    {
      n: 2,
      name: "The queue, in service order",
      minutes: "10–15 min",
      ops: [
        ["TOP_PENDING(timestamp, n)", "The next n jobs due to run, as \"job_id(priority)\". Highest priority first, then earliest submitted, then by id."],
      ],
      idea: [
        "A three-part ordering rule is a tuple: (-priority, submitted_at, id). Put it on the Job as a queue_key() method rather than inline in the sort, because level 3 needs the exact same comparison to decide what a free worker picks up — and two copies of an ordering rule is one copy too many.",
        "Sorting the pending jobs per query is the right call. A heap looks tempting and is a trap: cancellations and (at level 4) dependencies mean the best job can change without anything being pushed or popped, so a heap needs lazy deletion to stay honest. n is small; sort.",
      ],
      design: [
        "Job.queue_key() returns (-priority, submitted_at, id) — defined once, used everywhere.",
        "Filter to PENDING first; cancelled and finished jobs are not in the queue.",
        "Slice to n after sorting, and let n exceed the queue length harmlessly.",
      ],
      code: `class Job:
    """A unit of work.

    It is a class from level 1, not an int, because a job already has three
    attributes — and levels 3 and 4 add four more without changing the shape.
    """

    def __init__(self, job_id, priority, submitted_at):
        self.id = job_id
        self.priority = priority
        self.submitted_at = submitted_at
        self.status = "PENDING"

    def queue_key(self):
        """Service order: highest priority, then first come, then by id.

        One method, so every level that asks 'what runs next?' asks it the
        same way — the level 3 scheduler reuses this untouched.
        """
        return (-self.priority, self.submitted_at, self.id)


class Scheduler:
    """Level 2 — level 1, plus the queue in the order it will be served."""

    def __init__(self):
        self.jobs = {}                             # job_id -> Job

    def submit(self, timestamp, job_id, priority):
        """False when the id is already taken."""
        if job_id in self.jobs:
            return False
        self.jobs[job_id] = Job(job_id, priority, timestamp)
        return True

    def get_status(self, timestamp, job_id):
        """PENDING / CANCELLED, or None when there is no such job."""
        job = self.jobs.get(job_id)
        return job.status if job is not None else None

    def cancel(self, timestamp, job_id):
        """True only when a job that had not run yet was actually cancelled."""
        job = self.jobs.get(job_id)
        if job is None or job.status != "PENDING":
            return False
        job.status = "CANCELLED"
        return True

    def top_pending(self, timestamp, n):
        """The next n jobs due to run, as "job_id(priority)"."""
        waiting = [j for j in self.jobs.values() if j.status == "PENDING"]
        waiting.sort(key=Job.queue_key)
        return [f"{j.id}({j.priority})" for j in waiting[:n]]`,
      trace: `SUBMIT(1,"a",5); SUBMIT(2,"b",9); SUBMIT(3,"c",5); SUBMIT(4,"d",1)

TOP_PENDING(5, 4)   ->  ["b(9)", "a(5)", "c(5)", "d(1)"]
                          ^ priority   ^ tie: "a" arrived first
TOP_PENDING(5, 2)   ->  ["b(9)", "a(5)"]
CANCEL(6, "b")
TOP_PENDING(7, 4)   ->  ["a(5)", "c(5)", "d(1)"]

Same priority AND same instant -> the id breaks the tie:
SUBMIT(0,"z",1); SUBMIT(0,"y",1)
TOP_PENDING(0, 2)   ->  ["y(1)", "z(1)"]`,
      pitfalls: [
        "sort(key=priority, reverse=True), which reverses the submission-time tie-break along with it.",
        "Leaving cancelled jobs in the ranking.",
        "Inlining the ordering rule here and writing it again — differently — in level 3.",
      ],
    },
    {
      n: 3,
      name: "Workers, durations, and simulated time",
      minutes: "30 min",
      ops: [
        ["SUBMIT(timestamp, job_id, priority, duration)", "Jobs now take time to run."],
        ["GET_STATUS(timestamp, job_id)", "PENDING / RUNNING / DONE / CANCELLED as of that moment."],
        ["BUSY_WORKERS(timestamp)", "How many of the pool's workers are occupied then."],
      ],
      idea: [
        "There is no clock and no thread. 'The status at t=7' means: replay every start and every completion in time order up to t=7, then answer. That replay belongs in one _advance(timestamp) that every operation calls first — the same shape as the banking cashback, except the events feed each other.",
        "The loop has to interleave properly. A completion at t=5 frees a worker that can start something at t=5, which may finish at t=7 and free it again. So: pop any completion due, else start the best ready job, else jump the clock to the next arrival, else stop. Loop until nothing more can happen by the deadline.",
        "Two things the simulation must not do: start a job before it was submitted, and start a job early just because a worker was idle. Both are one guard — the candidate search filters on submitted_at <= clock — and the 'jump to the next arrival' branch is what stops the loop spinning when workers idle.",
        "No preemption. A high-priority job that arrives while a long low-priority job is running waits for the worker, and priority only decides among jobs already waiting. That is worth saying out loud, because the alternative is a reasonable reading of the spec and the tests will pick one.",
      ],
      design: [
        "running: a min-heap of (finish_at, seq, job_id) — the seq keeps ties deterministic.",
        "clock: the simulated now, advanced only forwards, never past the requested timestamp.",
        "_advance() is the entire scheduler; the public operations are a call to it plus one line.",
        "submit() registers the job BEFORE the replay, so a free worker can take it in the same instant — and never earlier, because the candidate filter checks submitted_at.",
        "started_at / finished_at recorded on the job, which is what makes level 4's timeline free.",
      ],
      code: `import heapq


class Job:
    """A unit of work.

    It is a class from level 1, not an int, because a job already has three
    attributes — and levels 3 and 4 add four more without changing the shape.
    """

    def __init__(self, job_id, priority, submitted_at, duration=0):
        self.id = job_id
        self.priority = priority
        self.submitted_at = submitted_at
        self.duration = duration
        self.status = "PENDING"
        self.started_at = None
        self.finished_at = None

    def queue_key(self):
        """Service order: highest priority, then first come, then by id.

        One method, so every level that asks 'what runs next?' asks it the
        same way — the level 3 scheduler reuses this untouched.
        """
        return (-self.priority, self.submitted_at, self.id)


class Scheduler:
    """Level 3 — jobs take time, and a fixed pool of workers runs them.

    There is no thread and no clock. The whole schedule is replayed inside
    _advance(), which is called by every operation before it answers: the
    simulation only ever runs as far as the moment someone asked about.
    """

    def __init__(self, workers=1):
        self.jobs = {}                             # job_id -> Job
        self.workers = workers
        self.free = workers
        self.running = []                          # min-heap of (finish_at, seq, job_id)
        self.clock = 0
        self.seq = 0

    # --- the simulation --------------------------------------------------
    def _ready(self, at):
        """The pending job that should start at \`at\`, or None."""
        best = None
        for job in self.jobs.values():
            if job.status != "PENDING" or job.submitted_at > at:
                continue
            if best is None or job.queue_key() < best.queue_key():
                best = job
        return best

    def _next_arrival(self, until):
        """The next moment a waiting job becomes visible to the scheduler."""
        times = [j.submitted_at for j in self.jobs.values()
                 if j.status == "PENDING" and self.clock < j.submitted_at <= until]
        return min(times) if times else None

    def _start(self, job, at):
        job.status = "RUNNING"
        job.started_at = at
        self.seq += 1
        self.free -= 1
        heapq.heappush(self.running, (at + job.duration, self.seq, job.id))

    def _finish(self, job, at):
        job.status = "DONE"
        job.finished_at = at
        self.free += 1

    def _advance(self, timestamp):
        """Replay the schedule forward until nothing more can happen by then."""
        while True:
            # A completion always comes before any decision taken after it.
            if self.running and self.running[0][0] <= timestamp:
                finish_at, _, job_id = heapq.heappop(self.running)
                self.clock = max(self.clock, finish_at)
                self._finish(self.jobs[job_id], finish_at)
                continue
            if self.free > 0:
                job = self._ready(self.clock)
                if job is not None:
                    self._start(job, self.clock)
                    continue
                # Idle workers: skip ahead to the next job that shows up.
                arrival = self._next_arrival(timestamp)
                if arrival is not None:
                    self.clock = arrival
                    continue
            break
        self.clock = max(self.clock, timestamp)

    # --- operations -------------------------------------------------------
    def submit(self, timestamp, job_id, priority, duration=0):
        if job_id in self.jobs:
            return False
        # Registered before the replay, so a free worker can pick it up in
        # the same instant it arrives — but never before it arrives, because
        # _ready() filters on submitted_at.
        self.jobs[job_id] = Job(job_id, priority, timestamp, duration)
        self._advance(timestamp)
        return True

    def get_status(self, timestamp, job_id):
        """PENDING / RUNNING / DONE / CANCELLED, or None."""
        self._advance(timestamp)
        job = self.jobs.get(job_id)
        return job.status if job is not None else None

    def cancel(self, timestamp, job_id):
        """True only when a job that had not started yet was cancelled."""
        self._advance(timestamp)
        job = self.jobs.get(job_id)
        if job is None or job.status != "PENDING":
            return False
        job.status = "CANCELLED"
        return True

    def top_pending(self, timestamp, n):
        """The next n jobs due to run, as "job_id(priority)"."""
        self._advance(timestamp)
        waiting = [j for j in self.jobs.values() if j.status == "PENDING"]
        waiting.sort(key=Job.queue_key)
        return [f"{j.id}({j.priority})" for j in waiting[:n]]

    def busy_workers(self, timestamp):
        """How many workers are occupied at that moment."""
        self._advance(timestamp)
        return self.workers - self.free`,
      trace: `Scheduler(workers=1)
SUBMIT(0, "a", priority=1, duration=5)     # runs 0 -> 5
SUBMIT(1, "b", priority=9, duration=2)     # arrives while a is running

GET_STATUS(1, "a")  ->  "RUNNING"
GET_STATUS(1, "b")  ->  "PENDING"    # higher priority does NOT preempt
GET_STATUS(5, "b")  ->  "RUNNING"    # takes the worker the instant a frees it
GET_STATUS(7, "b")  ->  "DONE"

Two workers run in parallel:
Scheduler(workers=2); SUBMIT(0,"a",1,5); SUBMIT(0,"b",9,2)
BUSY_WORKERS(0) -> 2    BUSY_WORKERS(2) -> 1    BUSY_WORKERS(5) -> 0

One long jump replays the whole queue:
workers=1, four jobs of duration 2 submitted at t=0
GET_STATUS(8, ...) -> all DONE, started at 0, 2, 4, 6

An idle worker still waits for the job to arrive:
SUBMIT(10, "late", 1, 2)   ->  started_at == 10, not 0`,
      pitfalls: [
        "Answering from stored state without replaying, so a job stays RUNNING forever.",
        "Advancing completions and starts in separate passes, so a worker freed at t=5 does not pick anything up until the next query.",
        "Starting a job before its submission time because a worker happened to be idle.",
        "Forgetting the 'jump to the next arrival' case, which leaves the loop unable to make progress when all workers are idle and the next job is in the future.",
        "A heap of (finish_at, job_id) that raises when two jobs finish in the same millisecond and the ids are not comparable — carry an ordinal.",
      ],
    },
    {
      n: 4,
      name: "Dependencies",
      minutes: "20–25 min",
      ops: [
        ["SUBMIT(…, deps)", "A job waits for every dependency to finish. False when a dependency is unknown or already cancelled."],
        ["BLOCKED_BY(timestamp, job_id)", "Which of its dependencies have still not finished."],
        ["TIMELINE(timestamp, job_id)", "When it was submitted, started and finished."],
        ["CANCEL(timestamp, job_id)", "Now cascades: cancelling a job strands everything waiting on it."],
      ],
      idea: [
        "The scheduling change is one predicate: a job is only a candidate if all its dependencies are DONE. That is the entire cost, and it is one line because level 3 had exactly one place that decided what runs — which is the argument for building level 3 that way in the first place.",
        "Requiring dependencies to already exist makes a cycle impossible: every edge points backwards in time. Notice that and say it, rather than writing a cycle check that can never fire. Interviewers remember the candidate who explained why the hard case was excluded by construction.",
        "The real work is what a dependency implies for cancellation. A job whose dependency is cancelled can never run, so it is not pending — it is cancelled too, and so is everything behind it. That needs a reverse index of dependents and a walk, and it is the only new state this level adds.",
        "Nothing is needed for TIMELINE at all: level 3 already recorded started_at and finished_at at the moment each happened. When level 4 asks for history and you have nothing to build, that is the level-3 design paying out.",
      ],
      design: [
        "deps on the Job; dependents: job_id -> the jobs waiting on it, for the cancel cascade.",
        "_deps_done(job) is the new predicate in the candidate filter — nowhere else.",
        "A dependency finishing is a completion event, so the existing loop retries the starts by itself.",
        "Cancel walks dependents with an explicit stack and only touches PENDING jobs.",
        "Deps must exist and must not be cancelled; a rejected submit registers nothing at all.",
      ],
      code: `import heapq


class Job:
    """A unit of work.

    It is a class from level 1, not an int, because a job already has three
    attributes — and levels 3 and 4 add four more without changing the shape.
    """

    def __init__(self, job_id, priority, submitted_at, duration=0, deps=()):
        self.id = job_id
        self.priority = priority
        self.submitted_at = submitted_at
        self.duration = duration
        self.deps = tuple(deps)                    # jobs that must finish first
        self.status = "PENDING"
        self.started_at = None
        self.finished_at = None

    def queue_key(self):
        """Service order: highest priority, then first come, then by id.

        One method, so every level that asks 'what runs next?' asks it the
        same way — the level 3 scheduler reuses this untouched.
        """
        return (-self.priority, self.submitted_at, self.id)


class Scheduler:
    """Level 4 — jobs can wait for other jobs to finish first.

    Dependencies cost the scheduler one line — _ready() gains a predicate —
    because level 3 already had exactly one place that decided what runs.
    The work is all in what a dependency implies: a job nobody can unblock
    is not pending, it is cancelled.
    """

    def __init__(self, workers=1):
        self.jobs = {}                             # job_id -> Job
        self.workers = workers
        self.free = workers
        self.running = []                          # min-heap of (finish_at, seq, job_id)
        self.clock = 0
        self.seq = 0
        self.dependents = {}                       # job_id -> jobs waiting on it

    # --- the simulation --------------------------------------------------
    def _deps_done(self, job):
        return all(self.jobs[dep].status == "DONE" for dep in job.deps)

    def _ready(self, at):
        """The pending job that should start at \`at\`, or None."""
        best = None
        for job in self.jobs.values():
            if job.status != "PENDING" or job.submitted_at > at:
                continue
            if not self._deps_done(job):
                continue
            if best is None or job.queue_key() < best.queue_key():
                best = job
        return best

    def _next_arrival(self, until):
        """The next moment a waiting job becomes visible to the scheduler."""
        times = [j.submitted_at for j in self.jobs.values()
                 if j.status == "PENDING" and self.clock < j.submitted_at <= until]
        return min(times) if times else None

    def _start(self, job, at):
        job.status = "RUNNING"
        job.started_at = at
        self.seq += 1
        self.free -= 1
        heapq.heappush(self.running, (at + job.duration, self.seq, job.id))

    def _finish(self, job, at):
        job.status = "DONE"
        job.finished_at = at
        self.free += 1

    def _advance(self, timestamp):
        """Replay the schedule forward until nothing more can happen by then."""
        while True:
            # A completion always comes before any decision taken after it.
            if self.running and self.running[0][0] <= timestamp:
                finish_at, _, job_id = heapq.heappop(self.running)
                self.clock = max(self.clock, finish_at)
                self._finish(self.jobs[job_id], finish_at)
                continue
            if self.free > 0:
                job = self._ready(self.clock)
                if job is not None:
                    self._start(job, self.clock)
                    continue
                # Idle workers: skip ahead to the next job that shows up.
                arrival = self._next_arrival(timestamp)
                if arrival is not None:
                    self.clock = arrival
                    continue
            break
        self.clock = max(self.clock, timestamp)

    # --- operations -------------------------------------------------------
    def submit(self, timestamp, job_id, priority, duration=0, deps=()):
        """False on a duplicate id, or on a dependency that cannot be met.

        Requiring every dependency to already exist is what makes a cycle
        impossible: edges only ever point backwards in time, so there is
        nothing here to detect. Say that out loud rather than writing a
        cycle check that can never fire.
        """
        if job_id in self.jobs:
            return False
        for dep in deps:
            waiting_on = self.jobs.get(dep)
            if waiting_on is None or waiting_on.status == "CANCELLED":
                return False
        # Registered before the replay, so a free worker can pick it up in
        # the same instant it arrives — but never before it arrives, because
        # _ready() filters on submitted_at.
        self.jobs[job_id] = Job(job_id, priority, timestamp, duration, deps)
        for dep in deps:
            self.dependents.setdefault(dep, []).append(job_id)
        self._advance(timestamp)
        return True

    def get_status(self, timestamp, job_id):
        """PENDING / RUNNING / DONE / CANCELLED, or None."""
        self._advance(timestamp)
        job = self.jobs.get(job_id)
        return job.status if job is not None else None

    def cancel(self, timestamp, job_id):
        """True only when a job that had not started yet was cancelled.

        Cancelling strands everything waiting on it, so the cancellation
        walks the dependents transitively.
        """
        self._advance(timestamp)
        job = self.jobs.get(job_id)
        if job is None or job.status != "PENDING":
            return False
        stack = [job]
        while stack:
            current = stack.pop()
            if current.status != "PENDING":
                continue
            current.status = "CANCELLED"
            stack.extend(self.jobs[d] for d in self.dependents.get(current.id, ()))
        return True

    def top_pending(self, timestamp, n):
        """The next n jobs due to run, as "job_id(priority)"."""
        self._advance(timestamp)
        waiting = [j for j in self.jobs.values() if j.status == "PENDING"]
        waiting.sort(key=Job.queue_key)
        return [f"{j.id}({j.priority})" for j in waiting[:n]]

    def busy_workers(self, timestamp):
        """How many workers are occupied at that moment."""
        self._advance(timestamp)
        return self.workers - self.free

    def blocked_by(self, timestamp, job_id):
        """Which of this job's dependencies have still not finished."""
        self._advance(timestamp)
        job = self.jobs.get(job_id)
        if job is None:
            return None
        return sorted(d for d in job.deps if self.jobs[d].status != "DONE")

    def timeline(self, timestamp, job_id):
        """When the job was submitted, started and finished — None while pending."""
        self._advance(timestamp)
        job = self.jobs.get(job_id)
        if job is None:
            return None
        return (job.submitted_at, job.started_at, job.finished_at)`,
      trace: `Scheduler(workers=2)
SUBMIT(0, "build", priority=1, duration=5)
SUBMIT(0, "test",  priority=9, duration=2, deps=["build"])

GET_STATUS(0, "test")   ->  "PENDING"     # priority cannot jump a dependency
BUSY_WORKERS(0)         ->  1             # worker 2 idles; it cannot help
BLOCKED_BY(0, "test")   ->  ["build"]
GET_STATUS(5, "test")   ->  "RUNNING"     # the instant build finishes
TIMELINE(7, "test")     ->  (0, 5, 7)

Two dependencies: the slower one decides
"fast" (1 tick) and "slow" (4 ticks), then "join" on both
BLOCKED_BY(2, "join")   ->  ["slow"]
TIMELINE(6, "join")[1]  ->  4

Cancelling strands the chain behind it:
root -> mid -> leaf, all pending
CANCEL(1, "root")   ->  True
statuses            ->  CANCELLED, CANCELLED, CANCELLED

Refused up front:
SUBMIT(0, "x", 1, 1, deps=["ghost"])   ->  False, and "x" is not registered`,
      pitfalls: [
        "Leaving dependents PENDING forever after their dependency is cancelled — they are unrunnable, which is a status, not a wait.",
        "A half-registered job after a refused submit: validate every dependency before inserting anything.",
        "Writing cycle detection that cannot fire, instead of explaining why.",
        "Checking dependencies only at submit time, so a job whose deps finish later never becomes a candidate.",
        "Letting a blocked job hold a worker while it waits.",
      ],
    },
  ],
},
{
  id: "inventory",
  name: "Inventory / order system",
  tag: "stock you can hold",
  blurb: "Stock per SKU and a stock ranking; then orders that reserve stock on a timer, cancellations, sales rankings, and stock as of any past moment.",
  story:
    "A warehouse where the interesting number is not what exists but what is available — reserved " +
    "stock is physically there and commercially gone. Level 3 puts a clock on those reservations, " +
    "which means stock moves at moments when no operation is running, and level 4 then asks what the " +
    "level was at an arbitrary past instant. Recording a release at the right timestamp is the test.",
  structures: ["dict", "heapq", "bisect"],
  patterns: ["top-k-heap", "binary-search-index"],
  levels: [
    {
      n: 1,
      name: "Stock in, stock out",
      minutes: "10 min",
      ops: [
        ["ADD_STOCK(timestamp, sku, quantity)", "Receive units. Creates the SKU the first time it is seen."],
        ["GET_STOCK(timestamp, sku)", "Units on hand, or nothing for an unknown SKU."],
        ["REMOVE_STOCK(timestamp, sku, quantity)", "Ship units out. Nothing when the SKU is unknown or short."],
      ],
      idea: [
        "One dictionary of counters. The distinction to get right, and the one the tests check, is that an unknown SKU and a SKU sitting at zero are different answers: None versus 0. A SKU that has been stocked once stays known forever.",
        "Removing more than there is fails and changes nothing — the check comes before the subtraction. That sounds obvious until level 3, where an order touches several SKUs and a partial failure would leave the warehouse inconsistent.",
      ],
      design: [
        "sku -> units on hand. Integers; there are no fractional units here.",
        "get returns None for unknown, 0 for depleted. Never conflate them.",
        "Validate, then mutate — even when there is only one line to validate.",
      ],
      code: `class Inventory:
    """Level 1 — units on hand, per SKU."""

    def __init__(self):
        self.stock = {}                            # sku -> units on hand

    def add_stock(self, timestamp, sku, quantity):
        """Receive stock. Creates the SKU the first time it is seen."""
        self.stock[sku] = self.stock.get(sku, 0) + quantity
        return self.stock[sku]

    def get_stock(self, timestamp, sku):
        """Units on hand. None means unknown SKU — which is not the same as 0."""
        return self.stock.get(sku)

    def remove_stock(self, timestamp, sku, quantity):
        """Ship units out. None when the SKU is unknown or short."""
        on_hand = self.stock.get(sku)
        if on_hand is None or on_hand < quantity:
            return None
        self.stock[sku] = on_hand - quantity
        return self.stock[sku]`,
      trace: `ADD_STOCK(1, "apple", 10)     ->  10
ADD_STOCK(2, "apple", 5)      ->  15
REMOVE_STOCK(4, "apple", 5)   ->  10
REMOVE_STOCK(5, "apple", 999) ->  None    (short)
REMOVE_STOCK(5, "ghost", 1)   ->  None    (unknown)
REMOVE_STOCK(6, "apple", 10)  ->  0
GET_STOCK(7, "apple")         ->  0       (known, empty)
GET_STOCK(7, "ghost")         ->  None    (not a SKU)`,
      pitfalls: [
        "Returning 0 for an unknown SKU, which makes it indistinguishable from a depleted one.",
        "Deleting a SKU when it hits zero, so it disappears from the level-2 ranking.",
        "Subtracting first and checking afterwards.",
      ],
    },
    {
      n: 2,
      name: "The stock ranking",
      minutes: "5–10 min",
      ops: [
        ["TOP_STOCKED(timestamp, n)", "The n best-stocked SKUs, as \"sku(units)\". Most first, ties by SKU ascending."],
      ],
      idea: [
        "The same (-count, name) sort as everywhere else in this set, over state level 1 already keeps. If this level takes more than five minutes, level 1 stored the wrong thing.",
        "The judgement call is whether a SKU at zero appears. It does — it is a real SKU with a real level — and the fact that this is a judgement call at all is why it belongs in a clarifying question rather than an assumption.",
      ],
      design: [
        "No new state. Level 2 is a pure function of the stock dictionary.",
        "key=lambda kv: (-kv[1], kv[0]) — units descending, SKU ascending.",
        "Zero-stock SKUs rank last but do rank.",
      ],
      code: `class Inventory:
    """Level 2 — level 1, plus the stock ranking."""

    def __init__(self):
        self.stock = {}                            # sku -> units on hand

    def add_stock(self, timestamp, sku, quantity):
        """Receive stock. Creates the SKU the first time it is seen."""
        self.stock[sku] = self.stock.get(sku, 0) + quantity
        return self.stock[sku]

    def get_stock(self, timestamp, sku):
        """Units on hand. None means unknown SKU — which is not the same as 0."""
        return self.stock.get(sku)

    def remove_stock(self, timestamp, sku, quantity):
        """Ship units out. None when the SKU is unknown or short."""
        on_hand = self.stock.get(sku)
        if on_hand is None or on_hand < quantity:
            return None
        self.stock[sku] = on_hand - quantity
        return self.stock[sku]

    def top_stocked(self, timestamp, n):
        """The n best-stocked SKUs, as "sku(units)".

        Most first; ties broken by SKU, ascending. A SKU sitting at zero is
        still a SKU and still ranks.
        """
        ranked = sorted(self.stock.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{sku}({units})" for sku, units in ranked[:n]]`,
      trace: `stock:  fig 7, pear 7, kiwi 3, apple 0

TOP_STOCKED(9, 3)    ->  ["fig(7)", "pear(7)", "kiwi(3)"]
                           ^ tie on 7 -> "fig" before "pear"
TOP_STOCKED(9, 99)   ->  ["fig(7)", "pear(7)", "kiwi(3)", "apple(0)"]`,
      pitfalls: [
        "Filtering out zero-stock SKUs without being asked to.",
        "reverse=True plus a secondary key, which flips the tie-break too.",
        "Formatting with a space — \"sku(units)\" is exact.",
      ],
    },
    {
      n: 3,
      name: "Orders that hold stock on a timer",
      minutes: "25–30 min",
      ops: [
        ["PLACE_ORDER(timestamp, order_id, items)", "Reserve every line or none. False if any line is short."],
        ["PAY_ORDER(timestamp, order_id)", "True when a live reservation was paid for."],
        ["GET_ORDER_STATUS(timestamp, order_id)", "RESERVED / PAID / EXPIRED, or nothing."],
        ["the hold", "An unpaid reservation lapses 15 minutes after it was placed, and the units go back."],
      ],
      idea: [
        "Decide what the stock number means, once: it is what is AVAILABLE, with reservations already deducted. Then placing an order is a subtraction, a lapse is an addition, and no operation ever has to compute 'on hand minus holds' on the fly.",
        "Reservations lapse at a known future moment with nothing running, which is the cashback problem in different clothes: a min-heap keyed by the lapse time and an _advance(timestamp) at the top of every operation, read-only ones included.",
        "Paying does not remove the order's heap entry — there is no cheap way to find it. Leave it and let _advance skip any order that is no longer RESERVED. Lazy deletion is the standard answer, and saying the words is worth as much as the code.",
        "An order is all-or-nothing across several SKUs. Check every line before moving any units, or a short third line leaves the first two deducted and the warehouse wrong.",
      ],
      design: [
        "stock holds AVAILABLE units; an Order carries its items, its placed_at and its expires_at.",
        "holds: a min-heap of (expires_at, order_id), with stale entries tolerated.",
        "_advance(timestamp) at the top of every operation, including the status read.",
        "Two passes in place_order: validate all lines, then apply all lines.",
        "PAID is terminal — a paid order never expires, and its units never come back.",
      ],
      code: `import heapq

HOLD_MS = 900_000                                  # a reservation lives 15 minutes


class Order:
    def __init__(self, order_id, items, placed_at):
        self.id = order_id
        self.items = dict(items)                   # sku -> units reserved
        self.placed_at = placed_at
        self.expires_at = placed_at + HOLD_MS
        self.status = "RESERVED"


class Inventory:
    """Level 3 — orders hold stock, and an unpaid hold expires by itself.

    'By itself' is a figure of speech: nothing runs in the background. Holds
    sit in a min-heap keyed by the moment they lapse, and _advance() settles
    everything due before any operation is allowed to look at the stock.
    """

    def __init__(self):
        self.stock = {}                            # sku -> units AVAILABLE (holds excluded)
        self.orders = {}                           # order_id -> Order
        self.holds = []                            # min-heap of (expires_at, order_id)

    # --- internals ------------------------------------------------------
    def _advance(self, timestamp):
        while self.holds and self.holds[0][0] <= timestamp:
            expires_at, order_id = heapq.heappop(self.holds)
            order = self.orders[order_id]
            if order.status != "RESERVED":
                continue                           # paid already: a stale heap entry
            order.status = "EXPIRED"
            for sku, units in order.items.items():
                self.stock[sku] = self.stock.get(sku, 0) + units

    # --- stock ----------------------------------------------------------
    def add_stock(self, timestamp, sku, quantity):
        self._advance(timestamp)
        self.stock[sku] = self.stock.get(sku, 0) + quantity
        return self.stock[sku]

    def get_stock(self, timestamp, sku):
        self._advance(timestamp)
        return self.stock.get(sku)

    def remove_stock(self, timestamp, sku, quantity):
        self._advance(timestamp)
        on_hand = self.stock.get(sku)
        if on_hand is None or on_hand < quantity:
            return None
        self.stock[sku] = on_hand - quantity
        return self.stock[sku]

    def top_stocked(self, timestamp, n):
        self._advance(timestamp)
        ranked = sorted(self.stock.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{sku}({units})" for sku, units in ranked[:n]]

    # --- orders ---------------------------------------------------------
    def place_order(self, timestamp, order_id, items):
        """Reserve every line, or none of them. False if anything is short."""
        self._advance(timestamp)
        if order_id in self.orders:
            return False
        for sku, units in items.items():
            if self.stock.get(sku, 0) < units:
                return False                       # check every line BEFORE moving any
        for sku, units in items.items():
            self.stock[sku] -= units
        order = Order(order_id, items, timestamp)
        self.orders[order_id] = order
        heapq.heappush(self.holds, (order.expires_at, order_id))
        return True

    def pay_order(self, timestamp, order_id):
        """True when a live reservation was paid for."""
        self._advance(timestamp)
        order = self.orders.get(order_id)
        if order is None or order.status != "RESERVED":
            return False
        order.status = "PAID"                      # the hold's heap entry is left to rot
        return True

    def get_order_status(self, timestamp, order_id):
        """RESERVED / PAID / EXPIRED, or None when there is no such order."""
        self._advance(timestamp)
        order = self.orders.get(order_id)
        return order.status if order is not None else None`,
      trace: `H = 900,000 ms (15 min)
stock: apple 10, pear 2

PLACE_ORDER(1, "o1", {apple: 4})   ->  True
GET_STOCK(1, "apple")              ->  6        (reserved units are gone)
PLACE_ORDER(2, "o2", {apple: 2, pear: 99}) -> False
GET_STOCK(2, "apple")              ->  6        (the apple line never moved)

GET_ORDER_STATUS(1+H-1, "o1")      ->  "RESERVED"
GET_ORDER_STATUS(1+H,   "o1")      ->  "EXPIRED"
GET_STOCK(1+H, "apple")            ->  10       (the hold lapsed)

Paying in time keeps the units sold:
PLACE_ORDER(0,"o1",{apple:4}); PAY_ORDER(5,"o1") -> True
GET_ORDER_STATUS(5H, "o1")   ->  "PAID"     (never expires)
GET_STOCK(5H, "apple")       ->  6          (and never comes back)

Paying too late is refused:
PAY_ORDER(H, "o1")   ->  False, status is already "EXPIRED"`,
      pitfalls: [
        "Settling lapsed holds only in the operations that move stock, so a status read reports a reservation that expired an hour ago.",
        "Deducting some lines of an order before discovering a later one is short.",
        "Trying to remove an order's heap entry when it is paid, instead of skipping it on the way out.",
        "Letting a paid or cancelled order's units be returned by the expiry sweep.",
        "Keeping stock as 'on hand' and subtracting holds at read time — it works until level 4 asks for a historical level.",
      ],
    },
    {
      n: 4,
      name: "Cancellations, sales, and stock back then",
      minutes: "25 min",
      ops: [
        ["CANCEL_ORDER(timestamp, order_id)", "Give a live reservation back. True only when there was one."],
        ["STOCK_AT(timestamp, sku, time_at)", "Units available at a past moment, or nothing if the SKU did not exist yet."],
        ["TOP_SELLERS(timestamp, n)", "The n best-selling SKUs by units actually paid for, as \"sku(units)\"."],
      ],
      idea: [
        "A historical level needs every movement recorded, and there were five places that moved stock — including one inside the expiry sweep, which is exactly the one people miss. Funnel them all through _set_stock(timestamp, sku, units) and the history is complete by construction rather than by vigilance.",
        "The timestamp that sweep records is the moment the hold LAPSED, not the moment somebody noticed. Those differ by however long nobody called an operation, and using the wrong one silently corrupts every STOCK_AT after it. This is the single highest-value line in the level.",
        "With the history sorted by construction, the lookup is a bisect for the last entry at or before the moment asked about — the same shape as the banking balance, which is the point: by the fourth of these, the moves repeat.",
        "Sales are units PAID for, not units reserved. Reservations that lapse or get cancelled never count, so the tally moves in pay_order and nowhere else.",
      ],
      design: [
        "history: sku -> [(timestamp, units)], append-only and sorted because writes arrive in time order.",
        "_set_stock() is the only thing that touches self.stock, sweep included.",
        "bisect_right(versions, (time_at, inf)) - 1 handles several movements in the same millisecond.",
        "sold: sku -> units, incremented on payment only.",
        "Cancel is RESERVED-only: a paid order cannot be cancelled, and a cancelled one never expires afterwards.",
      ],
      code: `import bisect
import heapq

HOLD_MS = 900_000                                  # a reservation lives 15 minutes


class Order:
    def __init__(self, order_id, items, placed_at):
        self.id = order_id
        self.items = dict(items)                   # sku -> units reserved
        self.placed_at = placed_at
        self.expires_at = placed_at + HOLD_MS
        self.status = "RESERVED"


class Inventory:
    """Level 4 — cancellations, sales rankings, and stock as of any past moment.

    Every change to a stock level now goes through _set_stock(), which is the
    only reason the history is complete: there were five places that moved
    stock, and one of them was inside the expiry sweep.
    """

    def __init__(self):
        self.stock = {}                            # sku -> units AVAILABLE (holds excluded)
        self.orders = {}                           # order_id -> Order
        self.holds = []                            # min-heap of (expires_at, order_id)
        self.history = {}                          # sku -> [(timestamp, units), ...]
        self.sold = {}                             # sku -> units actually paid for

    # --- internals ------------------------------------------------------
    def _set_stock(self, timestamp, sku, units):
        """The single funnel for every stock movement: level + history."""
        self.stock[sku] = units
        self.history.setdefault(sku, []).append((timestamp, units))

    def _advance(self, timestamp):
        while self.holds and self.holds[0][0] <= timestamp:
            expires_at, order_id = heapq.heappop(self.holds)
            order = self.orders[order_id]
            if order.status != "RESERVED":
                continue                           # paid already: a stale heap entry
            order.status = "EXPIRED"
            for sku, units in order.items.items():
                # Recorded at the moment the hold lapsed, NOT at the moment
                # somebody noticed — otherwise every later stock_at() is wrong.
                self._set_stock(expires_at, sku, self.stock.get(sku, 0) + units)

    # --- stock ----------------------------------------------------------
    def add_stock(self, timestamp, sku, quantity):
        self._advance(timestamp)
        self._set_stock(timestamp, sku, self.stock.get(sku, 0) + quantity)
        return self.stock[sku]

    def get_stock(self, timestamp, sku):
        self._advance(timestamp)
        return self.stock.get(sku)

    def remove_stock(self, timestamp, sku, quantity):
        self._advance(timestamp)
        on_hand = self.stock.get(sku)
        if on_hand is None or on_hand < quantity:
            return None
        self._set_stock(timestamp, sku, on_hand - quantity)
        return self.stock[sku]

    def top_stocked(self, timestamp, n):
        self._advance(timestamp)
        ranked = sorted(self.stock.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{sku}({units})" for sku, units in ranked[:n]]

    # --- orders ---------------------------------------------------------
    def place_order(self, timestamp, order_id, items):
        """Reserve every line, or none of them. False if anything is short."""
        self._advance(timestamp)
        if order_id in self.orders:
            return False
        for sku, units in items.items():
            if self.stock.get(sku, 0) < units:
                return False                       # check every line BEFORE moving any
        for sku, units in items.items():
            self._set_stock(timestamp, sku, self.stock[sku] - units)
        order = Order(order_id, items, timestamp)
        self.orders[order_id] = order
        heapq.heappush(self.holds, (order.expires_at, order_id))
        return True

    def pay_order(self, timestamp, order_id):
        """True when a live reservation was paid for."""
        self._advance(timestamp)
        order = self.orders.get(order_id)
        if order is None or order.status != "RESERVED":
            return False
        order.status = "PAID"                      # the hold's heap entry is left to rot
        for sku, units in order.items.items():
            self.sold[sku] = self.sold.get(sku, 0) + units
        return True

    def get_order_status(self, timestamp, order_id):
        """RESERVED / PAID / EXPIRED, or None when there is no such order."""
        self._advance(timestamp)
        order = self.orders.get(order_id)
        return order.status if order is not None else None

    def cancel_order(self, timestamp, order_id):
        """Give a live reservation back. True only when there was one."""
        self._advance(timestamp)
        order = self.orders.get(order_id)
        if order is None or order.status != "RESERVED":
            return False
        order.status = "CANCELLED"
        for sku, units in order.items.items():
            self._set_stock(timestamp, sku, self.stock.get(sku, 0) + units)
        return True

    def stock_at(self, timestamp, sku, time_at):
        """Units available at time_at, or None if the SKU did not exist yet."""
        self._advance(timestamp)
        versions = self.history.get(sku)
        if not versions:
            return None
        i = bisect.bisect_right(versions, (time_at, float("inf"))) - 1
        return versions[i][1] if i >= 0 else None

    def top_sellers(self, timestamp, n):
        """The n best-selling SKUs by units actually PAID for, as "sku(units)".

        Reservations do not count; only money does.
        """
        self._advance(timestamp)
        ranked = sorted(self.sold.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{sku}({units})" for sku, units in ranked[:n]]`,
      trace: `ADD_STOCK(10,"apple",10); ADD_STOCK(20,"apple",5); REMOVE_STOCK(30,"apple",3)
STOCK_AT(99, "apple", 5)    ->  None    (before the SKU existed)
STOCK_AT(99, "apple", 15)   ->  10
STOCK_AT(99, "apple", 20)   ->  15
STOCK_AT(99, "apple", 1e9)  ->  12

A lapse is recorded when it happened, not when it was noticed:
ADD_STOCK(0,"apple",10); PLACE_ORDER(0,"o1",{apple:4})
STOCK_AT(1e12, "apple", H-1)  ->  6
STOCK_AT(1e12, "apple", H)    ->  10      (not "now")

Only money counts as a sale:
o1{apple:5, pear:5} paid, o2{apple:3} paid, o3{fig:9} left to lapse
TOP_SELLERS(1, 5)   ->  ["apple(8)", "pear(5)"]
TOP_SELLERS(H, 5)   ->  ["apple(8)", "pear(5)"]    (o3 never sold)

CANCEL_ORDER(2, "o1")  ->  True, units returned at t=2
CANCEL_ORDER(3, "o1")  ->  False (not reserved any more)`,
      pitfalls: [
        "Recording the expiry release at the observing timestamp instead of the lapse timestamp.",
        "Missing the sweep when converting the writes to go through the funnel — it is the one that is not in an operation.",
        "Counting reservations as sales.",
        "Returning units twice: once on cancel and again when the stale heap entry comes up.",
        "Scanning the history instead of bisecting it.",
      ],
    },
  ],
},

{
  id: "hotel",
  name: "Hotel / parking / leaderboard",
  tag: "intervals, not instants",
  blurb: "Rooms, then bookings that must not overlap, then the cheapest room free for a window, then occupancy and revenue.",
  story:
    "The odd one out, and worth doing last. Everywhere else time arrives at level 3 as a timestamp " +
    "bolted onto existing operations; here the data IS an interval from level 2, so the ladder shifts " +
    "a rung and the ranked query lands at level 3 instead. The rungs are a pattern to recognise, not a " +
    "law — what stays true is that each level leans on an invariant the previous one established.",
  structures: ["bisect", "sortedlist", "dict"],
  patterns: ["intervals", "binary-search-index"],
  levels: [
    {
      n: 1,
      name: "The rooms",
      minutes: "5–10 min",
      ops: [
        ["ADD_ROOM(room_id, tier, price)", "False when the room number is already on the books."],
        ["GET_ROOM(room_id)", "Its tier and nightly rate, or nothing."],
        ["REMOVE_ROOM(room_id)", "True when a room was actually taken off the books."],
      ],
      idea: [
        "Three fields, so a Room class, for the same reason as everywhere else: level 3 sorts by price and level 4 multiplies by it, and neither wants to unpack a tuple by index.",
        "Note what is missing from these signatures: there is no timestamp. This challenge carries its time in the data — a booking's start and end — rather than in the calling convention, and that difference is what reshapes the rest of the ladder.",
      ],
      design: [
        "room_id -> Room(tier, price). Room ids are strings; \"101\" is not 101.",
        "No timestamp parameters anywhere. Do not invent them.",
        "Removal is unconditional here — level 2 gives it a reason to refuse.",
      ],
      code: `class Room:
    def __init__(self, room_id, tier, price):
        self.id = room_id
        self.tier = tier
        self.price = price                         # per night


class Hotel:
    """Level 1 — the rooms themselves."""

    def __init__(self):
        self.rooms = {}                            # room_id -> Room

    def add_room(self, room_id, tier, price):
        """False when the room number is already on the books."""
        if room_id in self.rooms:
            return False
        self.rooms[room_id] = Room(room_id, tier, price)
        return True

    def get_room(self, room_id):
        """(tier, price), or None when there is no such room."""
        room = self.rooms.get(room_id)
        return (room.tier, room.price) if room is not None else None

    def remove_room(self, room_id):
        """True when a room was actually taken off the books."""
        if room_id not in self.rooms:
            return False
        del self.rooms[room_id]
        return True`,
      trace: `ADD_ROOM("101", "standard", 90)   ->  True
ADD_ROOM("101", "suite", 400)     ->  False
GET_ROOM("101")                   ->  ("standard", 90)
GET_ROOM("999")                   ->  None
REMOVE_ROOM("999")                ->  False
REMOVE_ROOM("101")                ->  True`,
      pitfalls: [
        "Returning the Room object where the spec asks for its fields.",
        "Treating room ids as numbers, which breaks the id tie-break later.",
        "Adding a timestamp parameter out of habit because the other challenges have one.",
      ],
    },
    {
      n: 2,
      name: "Bookings that must not overlap",
      minutes: "20–25 min",
      ops: [
        ["BOOK(booking_id, room_id, start, end)", "False on a duplicate id, an unknown room, or any overlap."],
        ["CANCEL(booking_id)", "True when a live booking was released."],
        ["IS_FREE(room_id, start, end)", "Is the room clear for the whole window?"],
      ],
      idea: [
        "Settle the boundary before writing anything: stays are half-open, [start, end), so a guest checking out on day 5 and the next checking in on day 5 do not clash. Half-open is almost always what is wanted and it removes every off-by-one from the comparisons — but it is a question, not a guess.",
        "Keep each room's stays sorted and non-overlapping, and the clash check stops being a scan. Binary-search to the first stay starting at or after the new one: it clashes if it starts before our end, and the stay before it clashes if it ends after our start. Two comparisons, because the invariant guarantees no third candidate can reach across.",
        "That invariant is the whole level. It is what makes level 3's search cheap and level 4's occupancy query a lookup instead of a filter, so it is worth maintaining on every insert and every cancel rather than rebuilding.",
        "Reject the degenerate windows explicitly. start >= end is not a zero-night stay, it is a malformed request, and letting one in corrupts the ordering.",
      ],
      design: [
        "Room.stays: a sorted list of (start, end, booking_id), inserted with bisect.insort.",
        "bookings: booking_id -> Booking, so cancel can find which room to clean up.",
        "Overlap: [a,b) and [c,d) clash iff a < d and c < b. Written once, in is_free.",
        "A room with stays cannot be removed — level 1's unconditional delete gains a guard.",
        "start >= end is False, not a no-op.",
      ],
      code: `import bisect


class Room:
    def __init__(self, room_id, tier, price):
        self.id = room_id
        self.tier = tier
        self.price = price                         # per night
        self.stays = []                            # sorted [(start, end, booking_id)]


class Booking:
    def __init__(self, booking_id, room_id, start, end):
        self.id = booking_id
        self.room_id = room_id
        self.start = start
        self.end = end


class Hotel:
    """Level 2 — bookings, and the overlap rule that makes them legal.

    Stays are half-open, [start, end): a guest checking out on day 5 and the
    next checking in on day 5 do not clash. Each room keeps its stays sorted
    and non-overlapping, and that invariant is exactly what lets the clash
    check be two comparisons instead of a scan.
    """

    def __init__(self):
        self.rooms = {}                            # room_id -> Room
        self.bookings = {}                         # booking_id -> Booking

    def add_room(self, room_id, tier, price):
        if room_id in self.rooms:
            return False
        self.rooms[room_id] = Room(room_id, tier, price)
        return True

    def get_room(self, room_id):
        room = self.rooms.get(room_id)
        return (room.tier, room.price) if room is not None else None

    def remove_room(self, room_id):
        """A room with stays on it cannot be removed."""
        room = self.rooms.get(room_id)
        if room is None or room.stays:
            return False
        del self.rooms[room_id]
        return True

    def is_free(self, room_id, start, end):
        """Is this room clear for the whole of [start, end)?"""
        room = self.rooms.get(room_id)
        if room is None or start >= end:
            return False
        stays = room.stays
        i = bisect.bisect_left(stays, (start,))    # first stay starting at or after start
        if i < len(stays) and stays[i][0] < end:
            return False                           # the next stay begins inside ours
        if i > 0 and stays[i - 1][1] > start:
            return False                           # the previous stay runs into ours
        return True

    def book(self, booking_id, room_id, start, end):
        """False on a duplicate id, an unknown room, or any overlap."""
        if booking_id in self.bookings:
            return False
        if not self.is_free(room_id, start, end):
            return False
        bisect.insort(self.rooms[room_id].stays, (start, end, booking_id))
        self.bookings[booking_id] = Booking(booking_id, room_id, start, end)
        return True

    def cancel(self, booking_id):
        """True when a live booking was actually released."""
        booking = self.bookings.pop(booking_id, None)
        if booking is None:
            return False
        stays = self.rooms[booking.room_id].stays
        stay = (booking.start, booking.end, booking_id)
        i = bisect.bisect_left(stays, stay)
        if i < len(stays) and stays[i] == stay:
            stays.pop(i)
        return True`,
      trace: `ADD_ROOM("101","standard",90);  BOOK("b1","101", 10, 15)

BOOK("b3","101", 12, 13)  ->  False   contained
BOOK("b4","101",  8, 12)  ->  False   overlaps the front
BOOK("b5","101", 14, 20)  ->  False   overlaps the back
BOOK("b6","101",  5, 20)  ->  False   swallows it
BOOK("b7","101",  5, 10)  ->  True    abuts — half-open, so legal
BOOK("b8","101", 15, 20)  ->  True    abuts the other side
BOOK("b9","101", 20, 20)  ->  False   empty window
BOOK("b10","101",21, 20)  ->  False   inverted

REMOVE_ROOM("101")  ->  False   (it has stays on it)
CANCEL("b1")        ->  True
CANCEL("b1")        ->  False`,
      pitfalls: [
        "Closed intervals by accident, so back-to-back stays are rejected and the hotel loses half its nights.",
        "Checking only the stay after the insertion point and missing the one that starts earlier and runs long.",
        "Letting start >= end through.",
        "Cancelling the booking record but leaving its stay in the room's list, which then blocks the slot forever.",
        "Scanning every stay for the clash check — correct, but it is the complexity question this level exists to ask.",
      ],
    },
    {
      n: 3,
      name: "Find the cheapest room that fits",
      minutes: "15 min",
      ops: [
        ["AVAILABLE_ROOMS(start, end, tier?)", "Rooms free for the whole window, cheapest first, ties by room id."],
        ["BOOK_CHEAPEST(booking_id, start, end, tier?)", "Take the cheapest room that fits. Returns the room id, or nothing."],
      ],
      idea: [
        "This is level 2's question asked of every room, and it adds no state at all. When a level costs you nothing but a loop, the previous level put the invariant in the right place — that is the feedback this rung is really giving you.",
        "The ranking is (price, room_id) ascending, not a reversed sort: cheapest first means the natural direction for once. The optional tier is a filter applied before the sort, not a second sort key.",
        "BOOK_CHEAPEST is a composition, not a reimplementation: ask for the options, take the first, call BOOK. Duplicating the booking logic here to save a function call is how the two paths end up disagreeing about the overlap rule.",
      ],
      design: [
        "available_rooms filters with is_free and sorts by (price, id) — both existing pieces.",
        "book_cheapest delegates to book(); it never touches stays itself.",
        "A duplicate booking id returns None here, matching the 'nothing' in the signature, not False.",
        "An inverted or empty window fits nowhere, which falls out of is_free already.",
      ],
      code: `import bisect


class Room:
    def __init__(self, room_id, tier, price):
        self.id = room_id
        self.tier = tier
        self.price = price                         # per night
        self.stays = []                            # sorted [(start, end, booking_id)]


class Booking:
    def __init__(self, booking_id, room_id, start, end):
        self.id = booking_id
        self.room_id = room_id
        self.start = start
        self.end = end


class Hotel:
    """Level 3 — search the whole hotel, not one room at a time.

    Stays are half-open, [start, end): a guest checking out on day 5 and the
    next checking in on day 5 do not clash. Each room keeps its stays sorted
    and non-overlapping, and that invariant is exactly what lets the clash
    check be two comparisons instead of a scan.

    Availability is that same check asked of every room, so this level adds
    no state at all — the sign that level 2 put the invariant in the right
    place.
    """

    def __init__(self):
        self.rooms = {}                            # room_id -> Room
        self.bookings = {}                         # booking_id -> Booking

    def add_room(self, room_id, tier, price):
        if room_id in self.rooms:
            return False
        self.rooms[room_id] = Room(room_id, tier, price)
        return True

    def get_room(self, room_id):
        room = self.rooms.get(room_id)
        return (room.tier, room.price) if room is not None else None

    def remove_room(self, room_id):
        """A room with stays on it cannot be removed."""
        room = self.rooms.get(room_id)
        if room is None or room.stays:
            return False
        del self.rooms[room_id]
        return True

    def is_free(self, room_id, start, end):
        """Is this room clear for the whole of [start, end)?"""
        room = self.rooms.get(room_id)
        if room is None or start >= end:
            return False
        stays = room.stays
        i = bisect.bisect_left(stays, (start,))    # first stay starting at or after start
        if i < len(stays) and stays[i][0] < end:
            return False                           # the next stay begins inside ours
        if i > 0 and stays[i - 1][1] > start:
            return False                           # the previous stay runs into ours
        return True

    def book(self, booking_id, room_id, start, end):
        """False on a duplicate id, an unknown room, or any overlap."""
        if booking_id in self.bookings:
            return False
        if not self.is_free(room_id, start, end):
            return False
        bisect.insort(self.rooms[room_id].stays, (start, end, booking_id))
        self.bookings[booking_id] = Booking(booking_id, room_id, start, end)
        return True

    def cancel(self, booking_id):
        """True when a live booking was actually released."""
        booking = self.bookings.pop(booking_id, None)
        if booking is None:
            return False
        stays = self.rooms[booking.room_id].stays
        stay = (booking.start, booking.end, booking_id)
        i = bisect.bisect_left(stays, stay)
        if i < len(stays) and stays[i] == stay:
            stays.pop(i)
        return True

    def available_rooms(self, start, end, tier=None):
        """Rooms free for the whole window, cheapest first, ties by room id."""
        free = [room for room in self.rooms.values()
                if (tier is None or room.tier == tier)
                and self.is_free(room.id, start, end)]
        free.sort(key=lambda room: (room.price, room.id))
        return [room.id for room in free]

    def book_cheapest(self, booking_id, start, end, tier=None):
        """Take the cheapest room that fits. Returns the room id, or None."""
        if booking_id in self.bookings:
            return None
        options = self.available_rooms(start, end, tier)
        if not options:
            return None
        room_id = options[0]
        self.book(booking_id, room_id, start, end)
        return room_id`,
      trace: `rooms:  101 standard 90,  102 standard 80,  201 suite 400

AVAILABLE_ROOMS(1, 3)            ->  ["102", "101", "201"]   (by price)
AVAILABLE_ROOMS(1, 3, "suite")   ->  ["201"]
BOOK("b1", "101", 1, 5)
AVAILABLE_ROOMS(1, 3)            ->  ["102", "201"]
AVAILABLE_ROOMS(5, 9)            ->  ["102", "101", "201"]   (free again at 5)

BOOK_CHEAPEST("b1", 1, 5)  ->  "102"
BOOK_CHEAPEST("b2", 1, 5)  ->  "101"
BOOK_CHEAPEST("b3", 1, 5)  ->  "201"
BOOK_CHEAPEST("b4", 1, 5)  ->  None     (full)`,
      pitfalls: [
        "Sorting by price descending out of habit from the other challenges' top-n rules.",
        "Using tier as a sort key instead of a filter.",
        "Reimplementing the overlap check inside book_cheapest.",
        "Returning False rather than None when nothing fits.",
      ],
    },
    {
      n: 4,
      name: "Occupancy and revenue",
      minutes: "20 min",
      ops: [
        ["OCCUPIED_AT(time_at)", "The rooms with a guest in them at that instant, sorted."],
        ["OCCUPANCY(start, end)", "Room-nights sold inside the window, counting partial stays."],
        ["TOP_ROOMS(n)", "The n rooms earning the most, as \"room(revenue)\". Most first, ties by room id."],
      ],
      idea: [
        "Nothing new is recorded. Every other challenge needed a log at level 4 because its state was a snapshot that overwrote itself; here a booking has always carried its own window, so the history was never lost in the first place. Recognising that you have nothing to build is the win.",
        "OCCUPIED_AT is a bisect per room against the same sorted stays: find the last stay starting at or before the moment, and check whether it has ended. Half-open again does the work — a checkout at 13 means the room is free at 13.",
        "Revenue is derived from the live bookings rather than tallied on the side, precisely so a cancellation stops earning without anyone having to remember to decrement. The level-2 lesson in the key-value store, arrived at from the other direction: maintain an index when nothing can invalidate it behind your back, derive it when something can.",
        "OCCUPANCY counts the overlap of each stay with the window, not whole stays — a booking running from before the window to after it contributes the whole window. min(end, b) - max(start, a), floored at zero, is the one line that matters.",
      ],
      design: [
        "No new state at all; every query reads the stays and bookings level 2 already maintains.",
        "bisect_right(stays, (time_at, inf)) - 1, then check that the stay has not ended.",
        "Revenue = (end - start) x nightly price, summed over live bookings only.",
        "Rooms with no bookings still rank, at 0 — same rule as the SKUs sitting at zero.",
        "An empty or inverted window is 0 room-nights, not an error.",
      ],
      code: `import bisect


class Room:
    def __init__(self, room_id, tier, price):
        self.id = room_id
        self.tier = tier
        self.price = price                         # per night
        self.stays = []                            # sorted [(start, end, booking_id)]


class Booking:
    def __init__(self, booking_id, room_id, start, end):
        self.id = booking_id
        self.room_id = room_id
        self.start = start
        self.end = end


class Hotel:
    """Level 4 — what the hotel looked like, and what it earned.

    Stays are half-open, [start, end): a guest checking out on day 5 and the
    next checking in on day 5 do not clash. Each room keeps its stays sorted
    and non-overlapping, and that invariant is exactly what lets the clash
    check be two comparisons instead of a scan.

    Nothing new is recorded: a booking already carries its own window, so
    "who was in which room at noon on the 4th" is a question the existing
    stays answer. Revenue is derived from the live bookings for the same
    reason — a cancelled stay should stop counting, and a total maintained
    on the side is one more thing to remember to decrement.
    """

    def __init__(self):
        self.rooms = {}                            # room_id -> Room
        self.bookings = {}                         # booking_id -> Booking

    def add_room(self, room_id, tier, price):
        if room_id in self.rooms:
            return False
        self.rooms[room_id] = Room(room_id, tier, price)
        return True

    def get_room(self, room_id):
        room = self.rooms.get(room_id)
        return (room.tier, room.price) if room is not None else None

    def remove_room(self, room_id):
        """A room with stays on it cannot be removed."""
        room = self.rooms.get(room_id)
        if room is None or room.stays:
            return False
        del self.rooms[room_id]
        return True

    def is_free(self, room_id, start, end):
        """Is this room clear for the whole of [start, end)?"""
        room = self.rooms.get(room_id)
        if room is None or start >= end:
            return False
        stays = room.stays
        i = bisect.bisect_left(stays, (start,))    # first stay starting at or after start
        if i < len(stays) and stays[i][0] < end:
            return False                           # the next stay begins inside ours
        if i > 0 and stays[i - 1][1] > start:
            return False                           # the previous stay runs into ours
        return True

    def book(self, booking_id, room_id, start, end):
        """False on a duplicate id, an unknown room, or any overlap."""
        if booking_id in self.bookings:
            return False
        if not self.is_free(room_id, start, end):
            return False
        bisect.insort(self.rooms[room_id].stays, (start, end, booking_id))
        self.bookings[booking_id] = Booking(booking_id, room_id, start, end)
        return True

    def cancel(self, booking_id):
        """True when a live booking was actually released."""
        booking = self.bookings.pop(booking_id, None)
        if booking is None:
            return False
        stays = self.rooms[booking.room_id].stays
        stay = (booking.start, booking.end, booking_id)
        i = bisect.bisect_left(stays, stay)
        if i < len(stays) and stays[i] == stay:
            stays.pop(i)
        return True

    def available_rooms(self, start, end, tier=None):
        """Rooms free for the whole window, cheapest first, ties by room id."""
        free = [room for room in self.rooms.values()
                if (tier is None or room.tier == tier)
                and self.is_free(room.id, start, end)]
        free.sort(key=lambda room: (room.price, room.id))
        return [room.id for room in free]

    def book_cheapest(self, booking_id, start, end, tier=None):
        """Take the cheapest room that fits. Returns the room id, or None."""
        if booking_id in self.bookings:
            return None
        options = self.available_rooms(start, end, tier)
        if not options:
            return None
        room_id = options[0]
        self.book(booking_id, room_id, start, end)
        return room_id

    def occupied_at(self, time_at):
        """The rooms with a guest in them at that instant, sorted."""
        busy = []
        for room in self.rooms.values():
            stays = room.stays
            i = bisect.bisect_right(stays, (time_at, float("inf"))) - 1
            if i >= 0 and stays[i][1] > time_at:
                busy.append(room.id)
        return sorted(busy)

    def occupancy(self, start, end):
        """Room-nights sold inside [start, end), counting partial stays."""
        if start >= end:
            return 0
        nights = 0
        for booking in self.bookings.values():
            overlap = min(booking.end, end) - max(booking.start, start)
            if overlap > 0:
                nights += overlap
        return nights

    def top_rooms(self, n):
        """The n rooms earning the most, as "room(revenue)".

        Most first; ties broken by room id. Revenue is nights x nightly rate
        over the bookings that are still live.
        """
        earned = {room_id: 0 for room_id in self.rooms}
        for booking in self.bookings.values():
            room = self.rooms[booking.room_id]
            earned[room.id] += (booking.end - booking.start) * room.price
        ranked = sorted(earned.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{room_id}({revenue})" for room_id, revenue in ranked[:n]]`,
      trace: `101 at 100/night booked 10 -> 13;   102 at 50/night booked 12 -> 14

OCCUPIED_AT(9)    ->  []
OCCUPIED_AT(10)   ->  ["101"]
OCCUPIED_AT(12)   ->  ["101", "102"]
OCCUPIED_AT(13)   ->  ["102"]      (checkout at 13 is exclusive)
OCCUPIED_AT(14)   ->  []

OCCUPANCY(10, 14) ->  5            (3 nights + 2 nights)
OCCUPANCY(12, 13) ->  2            (both rooms, one night)
OCCUPANCY(0, 10)  ->  0
OCCUPANCY(11, 11) ->  0            (empty window)

TOP_ROOMS(5)      ->  ["101(300)", "102(100)"]
CANCEL("b1")
TOP_ROOMS(5)      ->  ["102(100)", "101(0)"]   (cancelled stays stop earning)`,
      pitfalls: [
        "Counting a stay that merely touches the window as a full stay instead of clipping it.",
        "Reporting a room as occupied on its checkout day.",
        "A revenue counter maintained on booking and forgotten on cancellation.",
        "Dropping rooms with no revenue from the ranking.",
        "Re-deriving occupancy by looping over every night in the window — fine for days, not for milliseconds.",
      ],
    },
  ],
},

];
