// ==UserScript==
// @name         teams-custom-reactions
// @namespace    npm/teams-custom-reactions
// @version      0.0.0
// @author       monkey
// @icon         https://vitejs.dev/logo.svg
// @downloadURL  https://github.com/Woyken/teams-custom-reactions-userscript/raw/gh-pages/teams-custom-reactions.user.js
// @match        https://teams.microsoft.com/multi-window/*
// ==/UserScript==

// use vite-plugin-monkey@2.3.1 at 2022-09-11T17:16:28.067Z

;(({ css = "" }) => {
  const style = document.createElement("style");
  style.innerText = css;
  style.dataset.source = "vite-plugin-monkey";
  document.head.appendChild(style);
})({
  "css": "body{margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;display:flex}code{font-family:source-code-pro,Menlo,Monaco,Consolas,Courier New,monospace}"
});

(function() {
  "use strict";
  const sharedConfig = {};
  function setHydrateContext(context) {
    sharedConfig.context = context;
  }
  const equalFn = (a, b) => a === b;
  const $PROXY = Symbol("solid-proxy");
  const $TRACK = Symbol("solid-track");
  const signalOptions = {
    equals: equalFn
  };
  let ERROR = null;
  let runEffects = runQueue;
  const STALE = 1;
  const PENDING = 2;
  const UNOWNED = {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  };
  const NO_INIT = {};
  var Owner = null;
  let Transition = null;
  let Listener = null;
  let Updates = null;
  let Effects = null;
  let ExecCount = 0;
  function createRoot(fn, detachedOwner) {
    const listener = Listener, owner = Owner, unowned = fn.length === 0, root = unowned && true ? UNOWNED : {
      owned: null,
      cleanups: null,
      context: null,
      owner: detachedOwner || owner
    }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
    Owner = root;
    Listener = null;
    try {
      return runUpdates(updateFn, true);
    } finally {
      Listener = listener;
      Owner = owner;
    }
  }
  function createSignal(value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const s = {
      value,
      observers: null,
      observerSlots: null,
      comparator: options.equals || void 0
    };
    const setter = (value2) => {
      if (typeof value2 === "function") {
        value2 = value2(s.value);
      }
      return writeSignal(s, value2);
    };
    return [readSignal.bind(s), setter];
  }
  function createComputed(fn, value, options) {
    const c = createComputation(fn, value, true, STALE);
    updateComputation(c);
  }
  function createRenderEffect(fn, value, options) {
    const c = createComputation(fn, value, false, STALE);
    updateComputation(c);
  }
  function createEffect(fn, value, options) {
    runEffects = runUserEffects;
    const c = createComputation(fn, value, false, STALE);
    c.user = true;
    Effects ? Effects.push(c) : updateComputation(c);
  }
  function createMemo(fn, value, options) {
    options = options ? Object.assign({}, signalOptions, options) : signalOptions;
    const c = createComputation(fn, value, true, 0);
    c.observers = null;
    c.observerSlots = null;
    c.comparator = options.equals || void 0;
    updateComputation(c);
    return readSignal.bind(c);
  }
  function createResource(pSource, pFetcher, pOptions) {
    let source;
    let fetcher;
    let options;
    if (arguments.length === 2 && typeof pFetcher === "object" || arguments.length === 1) {
      source = true;
      fetcher = pSource;
      options = pFetcher || {};
    } else {
      source = pSource;
      fetcher = pFetcher;
      options = pOptions || {};
    }
    let pr = null, initP = NO_INIT, id = null, scheduled = false, resolved = "initialValue" in options, dynamic = typeof source === "function" && createMemo(source);
    const contexts = /* @__PURE__ */ new Set(), [value, setValue] = (options.storage || createSignal)(options.initialValue), [error, setError] = createSignal(void 0), [track, trigger] = createSignal(void 0, {
      equals: false
    }), [state, setState] = createSignal(resolved ? "ready" : "unresolved");
    if (sharedConfig.context) {
      id = `${sharedConfig.context.id}${sharedConfig.context.count++}`;
      let v;
      if (options.ssrLoadFrom === "initial")
        initP = options.initialValue;
      else if (sharedConfig.load && (v = sharedConfig.load(id)))
        initP = v[0];
    }
    function loadEnd(p, v, error2, key) {
      if (pr === p) {
        pr = null;
        resolved = true;
        if ((p === initP || v === initP) && options.onHydrated)
          queueMicrotask(() => options.onHydrated(key, {
            value: v
          }));
        initP = NO_INIT;
        completeLoad(v, error2);
      }
      return v;
    }
    function completeLoad(v, err) {
      runUpdates(() => {
        if (!err)
          setValue(() => v);
        setError(err);
        setState(err ? "errored" : "ready");
        for (const c of contexts.keys())
          c.decrement();
        contexts.clear();
      }, false);
    }
    function read() {
      const c = SuspenseContext, v = value(), err = error();
      if (err && !pr)
        throw err;
      if (Listener && !Listener.user && c) {
        createComputed(() => {
          track();
          if (pr) {
            if (c.resolved)
              ;
            else if (!contexts.has(c)) {
              c.increment();
              contexts.add(c);
            }
          }
        });
      }
      return v;
    }
    function load(refetching = true) {
      if (refetching !== false && scheduled)
        return;
      scheduled = false;
      const lookup2 = dynamic ? dynamic() : source;
      if (lookup2 == null || lookup2 === false) {
        loadEnd(pr, untrack(value));
        return;
      }
      const p = initP !== NO_INIT ? initP : untrack(() => fetcher(lookup2, {
        value: value(),
        refetching
      }));
      if (typeof p !== "object" || !("then" in p)) {
        loadEnd(pr, p);
        return p;
      }
      pr = p;
      scheduled = true;
      queueMicrotask(() => scheduled = false);
      runUpdates(() => {
        setState(resolved ? "refreshing" : "pending");
        trigger();
      }, false);
      return p.then((v) => loadEnd(p, v, void 0, lookup2), (e) => loadEnd(p, void 0, castError(e)));
    }
    Object.defineProperties(read, {
      state: {
        get: () => state()
      },
      error: {
        get: () => error()
      },
      loading: {
        get() {
          const s = state();
          return s === "pending" || s === "refreshing";
        }
      },
      latest: {
        get() {
          if (!resolved)
            return read();
          const err = error();
          if (err && !pr)
            throw err;
          return value();
        }
      }
    });
    if (dynamic)
      createComputed(() => load(false));
    else
      load(false);
    return [read, {
      refetch: load,
      mutate: setValue
    }];
  }
  function batch(fn) {
    return runUpdates(fn, false);
  }
  function untrack(fn) {
    let result, listener = Listener;
    Listener = null;
    result = fn();
    Listener = listener;
    return result;
  }
  function onMount(fn) {
    createEffect(() => untrack(fn));
  }
  function onCleanup(fn) {
    if (Owner === null)
      ;
    else if (Owner.cleanups === null)
      Owner.cleanups = [fn];
    else
      Owner.cleanups.push(fn);
    return fn;
  }
  function onError(fn) {
    ERROR || (ERROR = Symbol("error"));
    if (Owner === null)
      ;
    else if (Owner.context === null)
      Owner.context = {
        [ERROR]: [fn]
      };
    else if (!Owner.context[ERROR])
      Owner.context[ERROR] = [fn];
    else
      Owner.context[ERROR].push(fn);
  }
  function getListener() {
    return Listener;
  }
  function createContext(defaultValue) {
    const id = Symbol("context");
    return {
      id,
      Provider: createProvider(id),
      defaultValue
    };
  }
  function useContext(context) {
    let ctx;
    return (ctx = lookup(Owner, context.id)) !== void 0 ? ctx : context.defaultValue;
  }
  function children(fn) {
    const children2 = createMemo(fn);
    const memo = createMemo(() => resolveChildren(children2()));
    memo.toArray = () => {
      const c = memo();
      return Array.isArray(c) ? c : c != null ? [c] : [];
    };
    return memo;
  }
  let SuspenseContext;
  function readSignal() {
    const runningTransition = Transition;
    if (this.sources && (this.state || runningTransition)) {
      if (this.state === STALE || runningTransition)
        updateComputation(this);
      else {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(this), false);
        Updates = updates;
      }
    }
    if (Listener) {
      const sSlot = this.observers ? this.observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [this];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(this);
        Listener.sourceSlots.push(sSlot);
      }
      if (!this.observers) {
        this.observers = [Listener];
        this.observerSlots = [Listener.sources.length - 1];
      } else {
        this.observers.push(Listener);
        this.observerSlots.push(Listener.sources.length - 1);
      }
    }
    return this.value;
  }
  function writeSignal(node, value, isComp) {
    let current = node.value;
    if (!node.comparator || !node.comparator(current, value)) {
      node.value = value;
      if (node.observers && node.observers.length) {
        runUpdates(() => {
          for (let i = 0; i < node.observers.length; i += 1) {
            const o = node.observers[i];
            const TransitionRunning = Transition && Transition.running;
            if (TransitionRunning && Transition.disposed.has(o))
              ;
            if (TransitionRunning && !o.tState || !TransitionRunning && !o.state) {
              if (o.pure)
                Updates.push(o);
              else
                Effects.push(o);
              if (o.observers)
                markDownstream(o);
            }
            if (TransitionRunning)
              ;
            else
              o.state = STALE;
          }
          if (Updates.length > 1e6) {
            Updates = [];
            if (false)
              ;
            throw new Error();
          }
        }, false);
      }
    }
    return value;
  }
  function updateComputation(node) {
    if (!node.fn)
      return;
    cleanNode(node);
    const owner = Owner, listener = Listener, time = ExecCount;
    Listener = Owner = node;
    runComputation(node, node.value, time);
    Listener = listener;
    Owner = owner;
  }
  function runComputation(node, value, time) {
    let nextValue;
    try {
      nextValue = node.fn(value);
    } catch (err) {
      if (node.pure)
        node.state = STALE;
      handleError(err);
    }
    if (!node.updatedAt || node.updatedAt <= time) {
      if (node.updatedAt != null && "observers" in node) {
        writeSignal(node, nextValue);
      } else
        node.value = nextValue;
      node.updatedAt = time;
    }
  }
  function createComputation(fn, init, pure, state = STALE, options) {
    const c = {
      fn,
      state,
      updatedAt: null,
      owned: null,
      sources: null,
      sourceSlots: null,
      cleanups: null,
      value: init,
      owner: Owner,
      context: null,
      pure
    };
    if (Owner === null)
      ;
    else if (Owner !== UNOWNED) {
      {
        if (!Owner.owned)
          Owner.owned = [c];
        else
          Owner.owned.push(c);
      }
    }
    return c;
  }
  function runTop(node) {
    const runningTransition = Transition;
    if (node.state === 0 || runningTransition)
      return;
    if (node.state === PENDING || runningTransition)
      return lookUpstream(node);
    if (node.suspense && untrack(node.suspense.inFallback))
      return node.suspense.effects.push(node);
    const ancestors = [node];
    while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
      if (node.state || runningTransition)
        ancestors.push(node);
    }
    for (let i = ancestors.length - 1; i >= 0; i--) {
      node = ancestors[i];
      if (node.state === STALE || runningTransition) {
        updateComputation(node);
      } else if (node.state === PENDING || runningTransition) {
        const updates = Updates;
        Updates = null;
        runUpdates(() => lookUpstream(node, ancestors[0]), false);
        Updates = updates;
      }
    }
  }
  function runUpdates(fn, init) {
    if (Updates)
      return fn();
    let wait = false;
    if (!init)
      Updates = [];
    if (Effects)
      wait = true;
    else
      Effects = [];
    ExecCount++;
    try {
      const res = fn();
      completeUpdates(wait);
      return res;
    } catch (err) {
      if (!Updates)
        Effects = null;
      handleError(err);
    }
  }
  function completeUpdates(wait) {
    if (Updates) {
      runQueue(Updates);
      Updates = null;
    }
    if (wait)
      return;
    const e = Effects;
    Effects = null;
    if (e.length)
      runUpdates(() => runEffects(e), false);
  }
  function runQueue(queue) {
    for (let i = 0; i < queue.length; i++)
      runTop(queue[i]);
  }
  function runUserEffects(queue) {
    let i, userLength = 0;
    for (i = 0; i < queue.length; i++) {
      const e = queue[i];
      if (!e.user)
        runTop(e);
      else
        queue[userLength++] = e;
    }
    if (sharedConfig.context)
      setHydrateContext();
    for (i = 0; i < userLength; i++)
      runTop(queue[i]);
  }
  function lookUpstream(node, ignore) {
    const runningTransition = Transition;
    node.state = 0;
    for (let i = 0; i < node.sources.length; i += 1) {
      const source = node.sources[i];
      if (source.sources) {
        if (source.state === STALE || runningTransition) {
          if (source !== ignore)
            runTop(source);
        } else if (source.state === PENDING || runningTransition)
          lookUpstream(source, ignore);
      }
    }
  }
  function markDownstream(node) {
    const runningTransition = Transition;
    for (let i = 0; i < node.observers.length; i += 1) {
      const o = node.observers[i];
      if (!o.state || runningTransition) {
        o.state = PENDING;
        if (o.pure)
          Updates.push(o);
        else
          Effects.push(o);
        o.observers && markDownstream(o);
      }
    }
  }
  function cleanNode(node) {
    let i;
    if (node.sources) {
      while (node.sources.length) {
        const source = node.sources.pop(), index2 = node.sourceSlots.pop(), obs = source.observers;
        if (obs && obs.length) {
          const n = obs.pop(), s = source.observerSlots.pop();
          if (index2 < obs.length) {
            n.sourceSlots[s] = index2;
            obs[index2] = n;
            source.observerSlots[index2] = s;
          }
        }
      }
    }
    if (node.owned) {
      for (i = 0; i < node.owned.length; i++)
        cleanNode(node.owned[i]);
      node.owned = null;
    }
    if (node.cleanups) {
      for (i = 0; i < node.cleanups.length; i++)
        node.cleanups[i]();
      node.cleanups = null;
    }
    node.state = 0;
    node.context = null;
  }
  function castError(err) {
    if (err instanceof Error || typeof err === "string")
      return err;
    return new Error("Unknown error");
  }
  function handleError(err) {
    err = castError(err);
    const fns = ERROR && lookup(Owner, ERROR);
    if (!fns)
      throw err;
    for (const f of fns)
      f(err);
  }
  function lookup(owner, key) {
    return owner ? owner.context && owner.context[key] !== void 0 ? owner.context[key] : lookup(owner.owner, key) : void 0;
  }
  function resolveChildren(children2) {
    if (typeof children2 === "function" && !children2.length)
      return resolveChildren(children2());
    if (Array.isArray(children2)) {
      const results = [];
      for (let i = 0; i < children2.length; i++) {
        const result = resolveChildren(children2[i]);
        Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
      }
      return results;
    }
    return children2;
  }
  function createProvider(id) {
    return function provider(props) {
      let res;
      createRenderEffect(() => res = untrack(() => {
        Owner.context = {
          [id]: props.value
        };
        return children(() => props.children);
      }));
      return res;
    };
  }
  const FALLBACK = Symbol("fallback");
  function dispose(d) {
    for (let i = 0; i < d.length; i++)
      d[i]();
  }
  function mapArray(list, mapFn, options = {}) {
    let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
    onCleanup(() => dispose(disposers));
    return () => {
      let newItems = list() || [], i, j;
      newItems[$TRACK];
      return untrack(() => {
        let newLen = newItems.length, newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
        if (newLen === 0) {
          if (len !== 0) {
            dispose(disposers);
            disposers = [];
            items = [];
            mapped = [];
            len = 0;
            indexes && (indexes = []);
          }
          if (options.fallback) {
            items = [FALLBACK];
            mapped[0] = createRoot((disposer) => {
              disposers[0] = disposer;
              return options.fallback();
            });
            len = 1;
          }
        } else if (len === 0) {
          mapped = new Array(newLen);
          for (j = 0; j < newLen; j++) {
            items[j] = newItems[j];
            mapped[j] = createRoot(mapper);
          }
          len = newLen;
        } else {
          temp = new Array(newLen);
          tempdisposers = new Array(newLen);
          indexes && (tempIndexes = new Array(newLen));
          for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++)
            ;
          for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
            temp[newEnd] = mapped[end];
            tempdisposers[newEnd] = disposers[end];
            indexes && (tempIndexes[newEnd] = indexes[end]);
          }
          newIndices = /* @__PURE__ */ new Map();
          newIndicesNext = new Array(newEnd + 1);
          for (j = newEnd; j >= start; j--) {
            item = newItems[j];
            i = newIndices.get(item);
            newIndicesNext[j] = i === void 0 ? -1 : i;
            newIndices.set(item, j);
          }
          for (i = start; i <= end; i++) {
            item = items[i];
            j = newIndices.get(item);
            if (j !== void 0 && j !== -1) {
              temp[j] = mapped[i];
              tempdisposers[j] = disposers[i];
              indexes && (tempIndexes[j] = indexes[i]);
              j = newIndicesNext[j];
              newIndices.set(item, j);
            } else
              disposers[i]();
          }
          for (j = start; j < newLen; j++) {
            if (j in temp) {
              mapped[j] = temp[j];
              disposers[j] = tempdisposers[j];
              if (indexes) {
                indexes[j] = tempIndexes[j];
                indexes[j](j);
              }
            } else
              mapped[j] = createRoot(mapper);
          }
          mapped = mapped.slice(0, len = newLen);
          items = newItems.slice(0);
        }
        return mapped;
      });
      function mapper(disposer) {
        disposers[j] = disposer;
        if (indexes) {
          const [s, set] = createSignal(j);
          indexes[j] = set;
          return mapFn(newItems[j], s);
        }
        return mapFn(newItems[j]);
      }
    };
  }
  function createComponent(Comp, props) {
    return untrack(() => Comp(props || {}));
  }
  function For(props) {
    const fallback = "fallback" in props && {
      fallback: () => props.fallback
    };
    return createMemo(mapArray(() => props.each, props.children, fallback ? fallback : void 0));
  }
  function Show(props) {
    let strictEqual = false;
    const keyed = props.keyed;
    const condition = createMemo(() => props.when, void 0, {
      equals: (a, b) => strictEqual ? a === b : !a === !b
    });
    return createMemo(() => {
      const c = condition();
      if (c) {
        const child = props.children;
        const fn = typeof child === "function" && child.length > 0;
        strictEqual = keyed || fn;
        return fn ? untrack(() => child(c)) : child;
      }
      return props.fallback;
    });
  }
  let Errors;
  function ErrorBoundary(props) {
    let err;
    let v;
    if (sharedConfig.context && sharedConfig.load && (v = sharedConfig.load(sharedConfig.context.id + sharedConfig.context.count)))
      err = v[0];
    const [errored, setErrored] = createSignal(err);
    Errors || (Errors = /* @__PURE__ */ new Set());
    Errors.add(setErrored);
    onCleanup(() => Errors.delete(setErrored));
    return createMemo(() => {
      let e;
      if (e = errored()) {
        const f = props.fallback;
        const res = typeof f === "function" && f.length ? untrack(() => f(e, () => setErrored())) : f;
        onError(setErrored);
        return res;
      }
      onError(setErrored);
      return props.children;
    });
  }
  function reconcileArrays(parentNode, a, b) {
    let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
    while (aStart < aEnd || bStart < bEnd) {
      if (a[aStart] === b[bStart]) {
        aStart++;
        bStart++;
        continue;
      }
      while (a[aEnd - 1] === b[bEnd - 1]) {
        aEnd--;
        bEnd--;
      }
      if (aEnd === aStart) {
        const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
        while (bStart < bEnd)
          parentNode.insertBefore(b[bStart++], node);
      } else if (bEnd === bStart) {
        while (aStart < aEnd) {
          if (!map || !map.has(a[aStart]))
            a[aStart].remove();
          aStart++;
        }
      } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
        const node = a[--aEnd].nextSibling;
        parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
        parentNode.insertBefore(b[--bEnd], node);
        a[aEnd] = b[bEnd];
      } else {
        if (!map) {
          map = /* @__PURE__ */ new Map();
          let i = bStart;
          while (i < bEnd)
            map.set(b[i], i++);
        }
        const index2 = map.get(a[aStart]);
        if (index2 != null) {
          if (bStart < index2 && index2 < bEnd) {
            let i = aStart, sequence = 1, t;
            while (++i < aEnd && i < bEnd) {
              if ((t = map.get(a[i])) == null || t !== index2 + sequence)
                break;
              sequence++;
            }
            if (sequence > index2 - bStart) {
              const node = a[aStart];
              while (bStart < index2)
                parentNode.insertBefore(b[bStart++], node);
            } else
              parentNode.replaceChild(b[bStart++], a[aStart++]);
          } else
            aStart++;
        } else
          a[aStart++].remove();
      }
    }
  }
  function render(code, element, init) {
    let disposer;
    createRoot((dispose2) => {
      disposer = dispose2;
      element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
    });
    return () => {
      disposer();
      element.textContent = "";
    };
  }
  function template(html, check, isSVG) {
    const t = document.createElement("template");
    t.innerHTML = html;
    let node = t.content.firstChild;
    if (isSVG)
      node = node.firstChild;
    return node;
  }
  function use(fn, element, arg) {
    return untrack(() => fn(element, arg));
  }
  function insert(parent, accessor, marker, initial) {
    if (marker !== void 0 && !initial)
      initial = [];
    if (typeof accessor !== "function")
      return insertExpression(parent, accessor, initial, marker);
    createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
  }
  function insertExpression(parent, value, current, marker, unwrapArray) {
    if (sharedConfig.context && !current)
      current = [...parent.childNodes];
    while (typeof current === "function")
      current = current();
    if (value === current)
      return current;
    const t = typeof value, multi = marker !== void 0;
    parent = multi && current[0] && current[0].parentNode || parent;
    if (t === "string" || t === "number") {
      if (sharedConfig.context)
        return current;
      if (t === "number")
        value = value.toString();
      if (multi) {
        let node = current[0];
        if (node && node.nodeType === 3) {
          node.data = value;
        } else
          node = document.createTextNode(value);
        current = cleanChildren(parent, current, marker, node);
      } else {
        if (current !== "" && typeof current === "string") {
          current = parent.firstChild.data = value;
        } else
          current = parent.textContent = value;
      }
    } else if (value == null || t === "boolean") {
      if (sharedConfig.context)
        return current;
      current = cleanChildren(parent, current, marker);
    } else if (t === "function") {
      createRenderEffect(() => {
        let v = value();
        while (typeof v === "function")
          v = v();
        current = insertExpression(parent, v, current, marker);
      });
      return () => current;
    } else if (Array.isArray(value)) {
      const array = [];
      const currentArray = current && Array.isArray(current);
      if (normalizeIncomingArray(array, value, current, unwrapArray)) {
        createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
        return () => current;
      }
      if (sharedConfig.context) {
        if (!array.length)
          return current;
        for (let i = 0; i < array.length; i++) {
          if (array[i].parentNode)
            return current = array;
        }
      }
      if (array.length === 0) {
        current = cleanChildren(parent, current, marker);
        if (multi)
          return current;
      } else if (currentArray) {
        if (current.length === 0) {
          appendNodes(parent, array, marker);
        } else
          reconcileArrays(parent, current, array);
      } else {
        current && cleanChildren(parent);
        appendNodes(parent, array);
      }
      current = array;
    } else if (value instanceof Node) {
      if (sharedConfig.context && value.parentNode)
        return current = multi ? [value] : value;
      if (Array.isArray(current)) {
        if (multi)
          return current = cleanChildren(parent, current, marker, value);
        cleanChildren(parent, current, null, value);
      } else if (current == null || current === "" || !parent.firstChild) {
        parent.appendChild(value);
      } else
        parent.replaceChild(value, parent.firstChild);
      current = value;
    } else
      ;
    return current;
  }
  function normalizeIncomingArray(normalized, array, current, unwrap2) {
    let dynamic = false;
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i], prev = current && current[i];
      if (item instanceof Node) {
        normalized.push(item);
      } else if (item == null || item === true || item === false)
        ;
      else if (Array.isArray(item)) {
        dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
      } else if (typeof item === "function") {
        if (unwrap2) {
          while (typeof item === "function")
            item = item();
          dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
        } else {
          normalized.push(item);
          dynamic = true;
        }
      } else {
        const value = String(item);
        if (prev && prev.nodeType === 3 && prev.data === value) {
          normalized.push(prev);
        } else
          normalized.push(document.createTextNode(value));
      }
    }
    return dynamic;
  }
  function appendNodes(parent, array, marker) {
    for (let i = 0, len = array.length; i < len; i++)
      parent.insertBefore(array[i], marker);
  }
  function cleanChildren(parent, current, marker, replacement) {
    if (marker === void 0)
      return parent.textContent = "";
    const node = replacement || document.createTextNode("");
    if (current.length) {
      let inserted = false;
      for (let i = current.length - 1; i >= 0; i--) {
        const el = current[i];
        if (node !== el) {
          const isParent = el.parentNode === parent;
          if (!inserted && !i)
            isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
          else
            isParent && el.remove();
        } else
          inserted = true;
      }
    } else
      parent.insertBefore(node, marker);
    return [node];
  }
  const index = "";
  /**
   * query-core
   *
   * Copyright (c) TanStack
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE.md file in the root directory of this source tree.
   *
   * @license MIT
   */
  class Subscribable {
    constructor() {
      this.listeners = [];
      this.subscribe = this.subscribe.bind(this);
    }
    subscribe(listener) {
      this.listeners.push(listener);
      this.onSubscribe();
      return () => {
        this.listeners = this.listeners.filter((x) => x !== listener);
        this.onUnsubscribe();
      };
    }
    hasListeners() {
      return this.listeners.length > 0;
    }
    onSubscribe() {
    }
    onUnsubscribe() {
    }
  }
  const isServer = typeof window === "undefined";
  function noop$1() {
    return void 0;
  }
  function functionalUpdate(updater, input) {
    return typeof updater === "function" ? updater(input) : updater;
  }
  function isValidTimeout(value) {
    return typeof value === "number" && value >= 0 && value !== Infinity;
  }
  function timeUntilStale(updatedAt, staleTime) {
    return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
  }
  function parseQueryArgs$1(arg1, arg2, arg3) {
    if (!isQueryKey$1(arg1)) {
      return arg1;
    }
    if (typeof arg2 === "function") {
      return {
        ...arg3,
        queryKey: arg1,
        queryFn: arg2
      };
    }
    return {
      ...arg2,
      queryKey: arg1
    };
  }
  function parseMutationArgs(arg1, arg2, arg3) {
    if (isQueryKey$1(arg1)) {
      if (typeof arg2 === "function") {
        return {
          ...arg3,
          mutationKey: arg1,
          mutationFn: arg2
        };
      }
      return {
        ...arg2,
        mutationKey: arg1
      };
    }
    if (typeof arg1 === "function") {
      return {
        ...arg2,
        mutationFn: arg1
      };
    }
    return {
      ...arg1
    };
  }
  function parseFilterArgs(arg1, arg2, arg3) {
    return isQueryKey$1(arg1) ? [{
      ...arg2,
      queryKey: arg1
    }, arg3] : [arg1 || {}, arg2];
  }
  function matchQuery(filters, query) {
    const {
      type = "all",
      exact,
      fetchStatus,
      predicate,
      queryKey,
      stale
    } = filters;
    if (isQueryKey$1(queryKey)) {
      if (exact) {
        if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) {
          return false;
        }
      } else if (!partialMatchKey(query.queryKey, queryKey)) {
        return false;
      }
    }
    if (type !== "all") {
      const isActive = query.isActive();
      if (type === "active" && !isActive) {
        return false;
      }
      if (type === "inactive" && isActive) {
        return false;
      }
    }
    if (typeof stale === "boolean" && query.isStale() !== stale) {
      return false;
    }
    if (typeof fetchStatus !== "undefined" && fetchStatus !== query.state.fetchStatus) {
      return false;
    }
    if (predicate && !predicate(query)) {
      return false;
    }
    return true;
  }
  function matchMutation(filters, mutation) {
    const {
      exact,
      fetching,
      predicate,
      mutationKey
    } = filters;
    if (isQueryKey$1(mutationKey)) {
      if (!mutation.options.mutationKey) {
        return false;
      }
      if (exact) {
        if (hashQueryKey(mutation.options.mutationKey) !== hashQueryKey(mutationKey)) {
          return false;
        }
      } else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) {
        return false;
      }
    }
    if (typeof fetching === "boolean" && mutation.state.status === "loading" !== fetching) {
      return false;
    }
    if (predicate && !predicate(mutation)) {
      return false;
    }
    return true;
  }
  function hashQueryKeyByOptions(queryKey, options) {
    const hashFn = (options == null ? void 0 : options.queryKeyHashFn) || hashQueryKey;
    return hashFn(queryKey);
  }
  function hashQueryKey(queryKey) {
    return JSON.stringify(queryKey, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
      result[key] = val[key];
      return result;
    }, {}) : val);
  }
  function partialMatchKey(a, b) {
    return partialDeepEqual(a, b);
  }
  function partialDeepEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (typeof a !== typeof b) {
      return false;
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      return !Object.keys(b).some((key) => !partialDeepEqual(a[key], b[key]));
    }
    return false;
  }
  function replaceEqualDeep(a, b) {
    if (a === b) {
      return a;
    }
    const array = isPlainArray(a) && isPlainArray(b);
    if (array || isPlainObject(a) && isPlainObject(b)) {
      const aSize = array ? a.length : Object.keys(a).length;
      const bItems = array ? b : Object.keys(b);
      const bSize = bItems.length;
      const copy = array ? [] : {};
      let equalItems = 0;
      for (let i = 0; i < bSize; i++) {
        const key = array ? i : bItems[i];
        copy[key] = replaceEqualDeep(a[key], b[key]);
        if (copy[key] === a[key]) {
          equalItems++;
        }
      }
      return aSize === bSize && equalItems === aSize ? a : copy;
    }
    return b;
  }
  function shallowEqualObjects(a, b) {
    if (a && !b || b && !a) {
      return false;
    }
    for (const key in a) {
      if (a[key] !== b[key]) {
        return false;
      }
    }
    return true;
  }
  function isPlainArray(value) {
    return Array.isArray(value) && value.length === Object.keys(value).length;
  }
  function isPlainObject(o) {
    if (!hasObjectPrototype(o)) {
      return false;
    }
    const ctor = o.constructor;
    if (typeof ctor === "undefined") {
      return true;
    }
    const prot = ctor.prototype;
    if (!hasObjectPrototype(prot)) {
      return false;
    }
    if (!prot.hasOwnProperty("isPrototypeOf")) {
      return false;
    }
    return true;
  }
  function hasObjectPrototype(o) {
    return Object.prototype.toString.call(o) === "[object Object]";
  }
  function isQueryKey$1(value) {
    return Array.isArray(value);
  }
  function sleep(timeout) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }
  function scheduleMicrotask(callback) {
    sleep(0).then(callback);
  }
  function getAbortController() {
    if (typeof AbortController === "function") {
      return new AbortController();
    }
  }
  function replaceData(prevData, data, options) {
    if (options.isDataEqual != null && options.isDataEqual(prevData, data)) {
      return prevData;
    } else if (typeof options.structuralSharing === "function") {
      return options.structuralSharing(prevData, data);
    } else if (options.structuralSharing !== false) {
      return replaceEqualDeep(prevData, data);
    }
    return data;
  }
  class FocusManager extends Subscribable {
    constructor() {
      super();
      this.setup = (onFocus) => {
        if (!isServer && window.addEventListener) {
          const listener = () => onFocus();
          window.addEventListener("visibilitychange", listener, false);
          window.addEventListener("focus", listener, false);
          return () => {
            window.removeEventListener("visibilitychange", listener);
            window.removeEventListener("focus", listener);
          };
        }
      };
    }
    onSubscribe() {
      if (!this.cleanup) {
        this.setEventListener(this.setup);
      }
    }
    onUnsubscribe() {
      if (!this.hasListeners()) {
        var _this$cleanup;
        (_this$cleanup = this.cleanup) == null ? void 0 : _this$cleanup.call(this);
        this.cleanup = void 0;
      }
    }
    setEventListener(setup) {
      var _this$cleanup2;
      this.setup = setup;
      (_this$cleanup2 = this.cleanup) == null ? void 0 : _this$cleanup2.call(this);
      this.cleanup = setup((focused) => {
        if (typeof focused === "boolean") {
          this.setFocused(focused);
        } else {
          this.onFocus();
        }
      });
    }
    setFocused(focused) {
      this.focused = focused;
      if (focused) {
        this.onFocus();
      }
    }
    onFocus() {
      this.listeners.forEach((listener) => {
        listener();
      });
    }
    isFocused() {
      if (typeof this.focused === "boolean") {
        return this.focused;
      }
      if (typeof document === "undefined") {
        return true;
      }
      return [void 0, "visible", "prerender"].includes(document.visibilityState);
    }
  }
  const focusManager = new FocusManager();
  class OnlineManager extends Subscribable {
    constructor() {
      super();
      this.setup = (onOnline) => {
        if (!isServer && window.addEventListener) {
          const listener = () => onOnline();
          window.addEventListener("online", listener, false);
          window.addEventListener("offline", listener, false);
          return () => {
            window.removeEventListener("online", listener);
            window.removeEventListener("offline", listener);
          };
        }
      };
    }
    onSubscribe() {
      if (!this.cleanup) {
        this.setEventListener(this.setup);
      }
    }
    onUnsubscribe() {
      if (!this.hasListeners()) {
        var _this$cleanup;
        (_this$cleanup = this.cleanup) == null ? void 0 : _this$cleanup.call(this);
        this.cleanup = void 0;
      }
    }
    setEventListener(setup) {
      var _this$cleanup2;
      this.setup = setup;
      (_this$cleanup2 = this.cleanup) == null ? void 0 : _this$cleanup2.call(this);
      this.cleanup = setup((online) => {
        if (typeof online === "boolean") {
          this.setOnline(online);
        } else {
          this.onOnline();
        }
      });
    }
    setOnline(online) {
      this.online = online;
      if (online) {
        this.onOnline();
      }
    }
    onOnline() {
      this.listeners.forEach((listener) => {
        listener();
      });
    }
    isOnline() {
      if (typeof this.online === "boolean") {
        return this.online;
      }
      if (typeof navigator === "undefined" || typeof navigator.onLine === "undefined") {
        return true;
      }
      return navigator.onLine;
    }
  }
  const onlineManager = new OnlineManager();
  function defaultRetryDelay(failureCount) {
    return Math.min(1e3 * 2 ** failureCount, 3e4);
  }
  function canFetch(networkMode) {
    return (networkMode != null ? networkMode : "online") === "online" ? onlineManager.isOnline() : true;
  }
  class CancelledError {
    constructor(options) {
      this.revert = options == null ? void 0 : options.revert;
      this.silent = options == null ? void 0 : options.silent;
    }
  }
  function isCancelledError(value) {
    return value instanceof CancelledError;
  }
  function createRetryer(config) {
    let isRetryCancelled = false;
    let failureCount = 0;
    let isResolved = false;
    let continueFn;
    let promiseResolve;
    let promiseReject;
    const promise = new Promise((outerResolve, outerReject) => {
      promiseResolve = outerResolve;
      promiseReject = outerReject;
    });
    const cancel = (cancelOptions) => {
      if (!isResolved) {
        reject(new CancelledError(cancelOptions));
        config.abort == null ? void 0 : config.abort();
      }
    };
    const cancelRetry = () => {
      isRetryCancelled = true;
    };
    const continueRetry = () => {
      isRetryCancelled = false;
    };
    const shouldPause = () => !focusManager.isFocused() || config.networkMode !== "always" && !onlineManager.isOnline();
    const resolve = (value) => {
      if (!isResolved) {
        isResolved = true;
        config.onSuccess == null ? void 0 : config.onSuccess(value);
        continueFn == null ? void 0 : continueFn();
        promiseResolve(value);
      }
    };
    const reject = (value) => {
      if (!isResolved) {
        isResolved = true;
        config.onError == null ? void 0 : config.onError(value);
        continueFn == null ? void 0 : continueFn();
        promiseReject(value);
      }
    };
    const pause = () => {
      return new Promise((continueResolve) => {
        continueFn = (value) => {
          if (isResolved || !shouldPause()) {
            return continueResolve(value);
          }
        };
        config.onPause == null ? void 0 : config.onPause();
      }).then(() => {
        continueFn = void 0;
        if (!isResolved) {
          config.onContinue == null ? void 0 : config.onContinue();
        }
      });
    };
    const run = () => {
      if (isResolved) {
        return;
      }
      let promiseOrValue;
      try {
        promiseOrValue = config.fn();
      } catch (error) {
        promiseOrValue = Promise.reject(error);
      }
      Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
        var _config$retry, _config$retryDelay;
        if (isResolved) {
          return;
        }
        const retry = (_config$retry = config.retry) != null ? _config$retry : 3;
        const retryDelay = (_config$retryDelay = config.retryDelay) != null ? _config$retryDelay : defaultRetryDelay;
        const delay = typeof retryDelay === "function" ? retryDelay(failureCount, error) : retryDelay;
        const shouldRetry = retry === true || typeof retry === "number" && failureCount < retry || typeof retry === "function" && retry(failureCount, error);
        if (isRetryCancelled || !shouldRetry) {
          reject(error);
          return;
        }
        failureCount++;
        config.onFail == null ? void 0 : config.onFail(failureCount, error);
        sleep(delay).then(() => {
          if (shouldPause()) {
            return pause();
          }
        }).then(() => {
          if (isRetryCancelled) {
            reject(error);
          } else {
            run();
          }
        });
      });
    };
    if (canFetch(config.networkMode)) {
      run();
    } else {
      pause().then(run);
    }
    return {
      promise,
      cancel,
      continue: () => {
        continueFn == null ? void 0 : continueFn();
      },
      cancelRetry,
      continueRetry
    };
  }
  const defaultLogger = console;
  function createNotifyManager() {
    let queue = [];
    let transactions = 0;
    let notifyFn = (callback) => {
      callback();
    };
    let batchNotifyFn = (callback) => {
      callback();
    };
    const batch2 = (callback) => {
      let result;
      transactions++;
      try {
        result = callback();
      } finally {
        transactions--;
        if (!transactions) {
          flush();
        }
      }
      return result;
    };
    const schedule = (callback) => {
      if (transactions) {
        queue.push(callback);
      } else {
        scheduleMicrotask(() => {
          notifyFn(callback);
        });
      }
    };
    const batchCalls = (callback) => {
      return (...args) => {
        schedule(() => {
          callback(...args);
        });
      };
    };
    const flush = () => {
      const originalQueue = queue;
      queue = [];
      if (originalQueue.length) {
        scheduleMicrotask(() => {
          batchNotifyFn(() => {
            originalQueue.forEach((callback) => {
              notifyFn(callback);
            });
          });
        });
      }
    };
    const setNotifyFunction = (fn) => {
      notifyFn = fn;
    };
    const setBatchNotifyFunction = (fn) => {
      batchNotifyFn = fn;
    };
    return {
      batch: batch2,
      batchCalls,
      schedule,
      setNotifyFunction,
      setBatchNotifyFunction
    };
  }
  const notifyManager = createNotifyManager();
  class Removable {
    destroy() {
      this.clearGcTimeout();
    }
    scheduleGc() {
      this.clearGcTimeout();
      if (isValidTimeout(this.cacheTime)) {
        this.gcTimeout = setTimeout(() => {
          this.optionalRemove();
        }, this.cacheTime);
      }
    }
    updateCacheTime(newCacheTime) {
      this.cacheTime = Math.max(this.cacheTime || 0, newCacheTime != null ? newCacheTime : isServer ? Infinity : 5 * 60 * 1e3);
    }
    clearGcTimeout() {
      if (this.gcTimeout) {
        clearTimeout(this.gcTimeout);
        this.gcTimeout = void 0;
      }
    }
  }
  class Query extends Removable {
    constructor(config) {
      super();
      this.abortSignalConsumed = false;
      this.defaultOptions = config.defaultOptions;
      this.setOptions(config.options);
      this.observers = [];
      this.cache = config.cache;
      this.logger = config.logger || defaultLogger;
      this.queryKey = config.queryKey;
      this.queryHash = config.queryHash;
      this.initialState = config.state || getDefaultState$1(this.options);
      this.state = this.initialState;
      this.meta = config.meta;
    }
    setOptions(options) {
      this.options = {
        ...this.defaultOptions,
        ...options
      };
      this.meta = options == null ? void 0 : options.meta;
      this.updateCacheTime(this.options.cacheTime);
    }
    optionalRemove() {
      if (!this.observers.length && this.state.fetchStatus === "idle") {
        this.cache.remove(this);
      }
    }
    setData(newData, options) {
      const data = replaceData(this.state.data, newData, this.options);
      this.dispatch({
        data,
        type: "success",
        dataUpdatedAt: options == null ? void 0 : options.updatedAt,
        manual: options == null ? void 0 : options.manual
      });
      return data;
    }
    setState(state, setStateOptions) {
      this.dispatch({
        type: "setState",
        state,
        setStateOptions
      });
    }
    cancel(options) {
      var _this$retryer;
      const promise = this.promise;
      (_this$retryer = this.retryer) == null ? void 0 : _this$retryer.cancel(options);
      return promise ? promise.then(noop$1).catch(noop$1) : Promise.resolve();
    }
    destroy() {
      super.destroy();
      this.cancel({
        silent: true
      });
    }
    reset() {
      this.destroy();
      this.setState(this.initialState);
    }
    isActive() {
      return this.observers.some((observer) => observer.options.enabled !== false);
    }
    isDisabled() {
      return this.getObserversCount() > 0 && !this.isActive();
    }
    isStale() {
      return this.state.isInvalidated || !this.state.dataUpdatedAt || this.observers.some((observer) => observer.getCurrentResult().isStale);
    }
    isStaleByTime(staleTime = 0) {
      return this.state.isInvalidated || !this.state.dataUpdatedAt || !timeUntilStale(this.state.dataUpdatedAt, staleTime);
    }
    onFocus() {
      var _this$retryer2;
      const observer = this.observers.find((x) => x.shouldFetchOnWindowFocus());
      if (observer) {
        observer.refetch({
          cancelRefetch: false
        });
      }
      (_this$retryer2 = this.retryer) == null ? void 0 : _this$retryer2.continue();
    }
    onOnline() {
      var _this$retryer3;
      const observer = this.observers.find((x) => x.shouldFetchOnReconnect());
      if (observer) {
        observer.refetch({
          cancelRefetch: false
        });
      }
      (_this$retryer3 = this.retryer) == null ? void 0 : _this$retryer3.continue();
    }
    addObserver(observer) {
      if (this.observers.indexOf(observer) === -1) {
        this.observers.push(observer);
        this.clearGcTimeout();
        this.cache.notify({
          type: "observerAdded",
          query: this,
          observer
        });
      }
    }
    removeObserver(observer) {
      if (this.observers.indexOf(observer) !== -1) {
        this.observers = this.observers.filter((x) => x !== observer);
        if (!this.observers.length) {
          if (this.retryer) {
            if (this.abortSignalConsumed) {
              this.retryer.cancel({
                revert: true
              });
            } else {
              this.retryer.cancelRetry();
            }
          }
          this.scheduleGc();
        }
        this.cache.notify({
          type: "observerRemoved",
          query: this,
          observer
        });
      }
    }
    getObserversCount() {
      return this.observers.length;
    }
    invalidate() {
      if (!this.state.isInvalidated) {
        this.dispatch({
          type: "invalidate"
        });
      }
    }
    fetch(options, fetchOptions) {
      var _this$options$behavio, _context$fetchOptions;
      if (this.state.fetchStatus !== "idle") {
        if (this.state.dataUpdatedAt && fetchOptions != null && fetchOptions.cancelRefetch) {
          this.cancel({
            silent: true
          });
        } else if (this.promise) {
          var _this$retryer4;
          (_this$retryer4 = this.retryer) == null ? void 0 : _this$retryer4.continueRetry();
          return this.promise;
        }
      }
      if (options) {
        this.setOptions(options);
      }
      if (!this.options.queryFn) {
        const observer = this.observers.find((x) => x.options.queryFn);
        if (observer) {
          this.setOptions(observer.options);
        }
      }
      if (!Array.isArray(this.options.queryKey))
        ;
      const abortController = getAbortController();
      const queryFnContext = {
        queryKey: this.queryKey,
        pageParam: void 0,
        meta: this.meta
      };
      const addSignalProperty = (object) => {
        Object.defineProperty(object, "signal", {
          enumerable: true,
          get: () => {
            if (abortController) {
              this.abortSignalConsumed = true;
              return abortController.signal;
            }
            return void 0;
          }
        });
      };
      addSignalProperty(queryFnContext);
      const fetchFn = () => {
        if (!this.options.queryFn) {
          return Promise.reject("Missing queryFn");
        }
        this.abortSignalConsumed = false;
        return this.options.queryFn(queryFnContext);
      };
      const context = {
        fetchOptions,
        options: this.options,
        queryKey: this.queryKey,
        state: this.state,
        fetchFn,
        meta: this.meta
      };
      addSignalProperty(context);
      (_this$options$behavio = this.options.behavior) == null ? void 0 : _this$options$behavio.onFetch(context);
      this.revertState = this.state;
      if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== ((_context$fetchOptions = context.fetchOptions) == null ? void 0 : _context$fetchOptions.meta)) {
        var _context$fetchOptions2;
        this.dispatch({
          type: "fetch",
          meta: (_context$fetchOptions2 = context.fetchOptions) == null ? void 0 : _context$fetchOptions2.meta
        });
      }
      const onError2 = (error) => {
        if (!(isCancelledError(error) && error.silent)) {
          this.dispatch({
            type: "error",
            error
          });
        }
        if (!isCancelledError(error)) {
          var _this$cache$config$on, _this$cache$config;
          (_this$cache$config$on = (_this$cache$config = this.cache.config).onError) == null ? void 0 : _this$cache$config$on.call(_this$cache$config, error, this);
        }
        if (!this.isFetchingOptimistic) {
          this.scheduleGc();
        }
        this.isFetchingOptimistic = false;
      };
      this.retryer = createRetryer({
        fn: context.fetchFn,
        abort: abortController == null ? void 0 : abortController.abort.bind(abortController),
        onSuccess: (data) => {
          var _this$cache$config$on2, _this$cache$config2;
          if (typeof data === "undefined") {
            onError2(new Error("Query data cannot be undefined"));
            return;
          }
          this.setData(data);
          (_this$cache$config$on2 = (_this$cache$config2 = this.cache.config).onSuccess) == null ? void 0 : _this$cache$config$on2.call(_this$cache$config2, data, this);
          if (!this.isFetchingOptimistic) {
            this.scheduleGc();
          }
          this.isFetchingOptimistic = false;
        },
        onError: onError2,
        onFail: () => {
          this.dispatch({
            type: "failed"
          });
        },
        onPause: () => {
          this.dispatch({
            type: "pause"
          });
        },
        onContinue: () => {
          this.dispatch({
            type: "continue"
          });
        },
        retry: context.options.retry,
        retryDelay: context.options.retryDelay,
        networkMode: context.options.networkMode
      });
      this.promise = this.retryer.promise;
      return this.promise;
    }
    dispatch(action) {
      const reducer = (state) => {
        var _action$meta, _action$dataUpdatedAt;
        switch (action.type) {
          case "failed":
            return {
              ...state,
              fetchFailureCount: state.fetchFailureCount + 1
            };
          case "pause":
            return {
              ...state,
              fetchStatus: "paused"
            };
          case "continue":
            return {
              ...state,
              fetchStatus: "fetching"
            };
          case "fetch":
            return {
              ...state,
              fetchFailureCount: 0,
              fetchMeta: (_action$meta = action.meta) != null ? _action$meta : null,
              fetchStatus: canFetch(this.options.networkMode) ? "fetching" : "paused",
              ...!state.dataUpdatedAt && {
                error: null,
                status: "loading"
              }
            };
          case "success":
            return {
              ...state,
              data: action.data,
              dataUpdateCount: state.dataUpdateCount + 1,
              dataUpdatedAt: (_action$dataUpdatedAt = action.dataUpdatedAt) != null ? _action$dataUpdatedAt : Date.now(),
              error: null,
              isInvalidated: false,
              status: "success",
              ...!action.manual && {
                fetchStatus: "idle",
                fetchFailureCount: 0
              }
            };
          case "error":
            const error = action.error;
            if (isCancelledError(error) && error.revert && this.revertState) {
              return {
                ...this.revertState
              };
            }
            return {
              ...state,
              error,
              errorUpdateCount: state.errorUpdateCount + 1,
              errorUpdatedAt: Date.now(),
              fetchFailureCount: state.fetchFailureCount + 1,
              fetchStatus: "idle",
              status: "error"
            };
          case "invalidate":
            return {
              ...state,
              isInvalidated: true
            };
          case "setState":
            return {
              ...state,
              ...action.state
            };
        }
      };
      this.state = reducer(this.state);
      notifyManager.batch(() => {
        this.observers.forEach((observer) => {
          observer.onQueryUpdate(action);
        });
        this.cache.notify({
          query: this,
          type: "updated",
          action
        });
      });
    }
  }
  function getDefaultState$1(options) {
    const data = typeof options.initialData === "function" ? options.initialData() : options.initialData;
    const hasInitialData = typeof options.initialData !== "undefined";
    const initialDataUpdatedAt = hasInitialData ? typeof options.initialDataUpdatedAt === "function" ? options.initialDataUpdatedAt() : options.initialDataUpdatedAt : 0;
    const hasData = typeof data !== "undefined";
    return {
      data,
      dataUpdateCount: 0,
      dataUpdatedAt: hasData ? initialDataUpdatedAt != null ? initialDataUpdatedAt : Date.now() : 0,
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchMeta: null,
      isInvalidated: false,
      status: hasData ? "success" : "loading",
      fetchStatus: "idle"
    };
  }
  class QueryCache extends Subscribable {
    constructor(config) {
      super();
      this.config = config || {};
      this.queries = [];
      this.queriesMap = {};
    }
    build(client, options, state) {
      var _options$queryHash;
      const queryKey = options.queryKey;
      const queryHash = (_options$queryHash = options.queryHash) != null ? _options$queryHash : hashQueryKeyByOptions(queryKey, options);
      let query = this.get(queryHash);
      if (!query) {
        query = new Query({
          cache: this,
          logger: client.getLogger(),
          queryKey,
          queryHash,
          options: client.defaultQueryOptions(options),
          state,
          defaultOptions: client.getQueryDefaults(queryKey),
          meta: options.meta
        });
        this.add(query);
      }
      return query;
    }
    add(query) {
      if (!this.queriesMap[query.queryHash]) {
        this.queriesMap[query.queryHash] = query;
        this.queries.push(query);
        this.notify({
          type: "added",
          query
        });
      }
    }
    remove(query) {
      const queryInMap = this.queriesMap[query.queryHash];
      if (queryInMap) {
        query.destroy();
        this.queries = this.queries.filter((x) => x !== query);
        if (queryInMap === query) {
          delete this.queriesMap[query.queryHash];
        }
        this.notify({
          type: "removed",
          query
        });
      }
    }
    clear() {
      notifyManager.batch(() => {
        this.queries.forEach((query) => {
          this.remove(query);
        });
      });
    }
    get(queryHash) {
      return this.queriesMap[queryHash];
    }
    getAll() {
      return this.queries;
    }
    find(arg1, arg2) {
      const [filters] = parseFilterArgs(arg1, arg2);
      if (typeof filters.exact === "undefined") {
        filters.exact = true;
      }
      return this.queries.find((query) => matchQuery(filters, query));
    }
    findAll(arg1, arg2) {
      const [filters] = parseFilterArgs(arg1, arg2);
      return Object.keys(filters).length > 0 ? this.queries.filter((query) => matchQuery(filters, query)) : this.queries;
    }
    notify(event) {
      notifyManager.batch(() => {
        this.listeners.forEach((listener) => {
          listener(event);
        });
      });
    }
    onFocus() {
      notifyManager.batch(() => {
        this.queries.forEach((query) => {
          query.onFocus();
        });
      });
    }
    onOnline() {
      notifyManager.batch(() => {
        this.queries.forEach((query) => {
          query.onOnline();
        });
      });
    }
  }
  class Mutation extends Removable {
    constructor(config) {
      super();
      this.options = {
        ...config.defaultOptions,
        ...config.options
      };
      this.mutationId = config.mutationId;
      this.mutationCache = config.mutationCache;
      this.logger = config.logger || defaultLogger;
      this.observers = [];
      this.state = config.state || getDefaultState();
      this.meta = config.meta;
      this.updateCacheTime(this.options.cacheTime);
      this.scheduleGc();
    }
    setState(state) {
      this.dispatch({
        type: "setState",
        state
      });
    }
    addObserver(observer) {
      if (this.observers.indexOf(observer) === -1) {
        this.observers.push(observer);
        this.clearGcTimeout();
        this.mutationCache.notify({
          type: "observerAdded",
          mutation: this,
          observer
        });
      }
    }
    removeObserver(observer) {
      this.observers = this.observers.filter((x) => x !== observer);
      this.scheduleGc();
      this.mutationCache.notify({
        type: "observerRemoved",
        mutation: this,
        observer
      });
    }
    optionalRemove() {
      if (!this.observers.length) {
        if (this.state.status === "loading") {
          this.scheduleGc();
        } else {
          this.mutationCache.remove(this);
        }
      }
    }
    continue() {
      if (this.retryer) {
        this.retryer.continue();
        return this.retryer.promise;
      }
      return this.execute();
    }
    async execute() {
      const executeMutation = () => {
        var _this$options$retry;
        this.retryer = createRetryer({
          fn: () => {
            if (!this.options.mutationFn) {
              return Promise.reject("No mutationFn found");
            }
            return this.options.mutationFn(this.state.variables);
          },
          onFail: () => {
            this.dispatch({
              type: "failed"
            });
          },
          onPause: () => {
            this.dispatch({
              type: "pause"
            });
          },
          onContinue: () => {
            this.dispatch({
              type: "continue"
            });
          },
          retry: (_this$options$retry = this.options.retry) != null ? _this$options$retry : 0,
          retryDelay: this.options.retryDelay,
          networkMode: this.options.networkMode
        });
        return this.retryer.promise;
      };
      const restored = this.state.status === "loading";
      try {
        var _this$mutationCache$c3, _this$mutationCache$c4, _this$options$onSucce, _this$options2, _this$options$onSettl, _this$options3;
        if (!restored) {
          var _this$mutationCache$c, _this$mutationCache$c2, _this$options$onMutat, _this$options;
          this.dispatch({
            type: "loading",
            variables: this.options.variables
          });
          (_this$mutationCache$c = (_this$mutationCache$c2 = this.mutationCache.config).onMutate) == null ? void 0 : _this$mutationCache$c.call(_this$mutationCache$c2, this.state.variables, this);
          const context = await ((_this$options$onMutat = (_this$options = this.options).onMutate) == null ? void 0 : _this$options$onMutat.call(_this$options, this.state.variables));
          if (context !== this.state.context) {
            this.dispatch({
              type: "loading",
              context,
              variables: this.state.variables
            });
          }
        }
        const data = await executeMutation();
        (_this$mutationCache$c3 = (_this$mutationCache$c4 = this.mutationCache.config).onSuccess) == null ? void 0 : _this$mutationCache$c3.call(_this$mutationCache$c4, data, this.state.variables, this.state.context, this);
        await ((_this$options$onSucce = (_this$options2 = this.options).onSuccess) == null ? void 0 : _this$options$onSucce.call(_this$options2, data, this.state.variables, this.state.context));
        await ((_this$options$onSettl = (_this$options3 = this.options).onSettled) == null ? void 0 : _this$options$onSettl.call(_this$options3, data, null, this.state.variables, this.state.context));
        this.dispatch({
          type: "success",
          data
        });
        return data;
      } catch (error) {
        try {
          var _this$mutationCache$c5, _this$mutationCache$c6, _this$options$onError, _this$options4, _this$options$onSettl2, _this$options5;
          (_this$mutationCache$c5 = (_this$mutationCache$c6 = this.mutationCache.config).onError) == null ? void 0 : _this$mutationCache$c5.call(_this$mutationCache$c6, error, this.state.variables, this.state.context, this);
          if (false)
            ;
          await ((_this$options$onError = (_this$options4 = this.options).onError) == null ? void 0 : _this$options$onError.call(_this$options4, error, this.state.variables, this.state.context));
          await ((_this$options$onSettl2 = (_this$options5 = this.options).onSettled) == null ? void 0 : _this$options$onSettl2.call(_this$options5, void 0, error, this.state.variables, this.state.context));
          throw error;
        } finally {
          this.dispatch({
            type: "error",
            error
          });
        }
      }
    }
    dispatch(action) {
      const reducer = (state) => {
        switch (action.type) {
          case "failed":
            return {
              ...state,
              failureCount: state.failureCount + 1
            };
          case "pause":
            return {
              ...state,
              isPaused: true
            };
          case "continue":
            return {
              ...state,
              isPaused: false
            };
          case "loading":
            return {
              ...state,
              context: action.context,
              data: void 0,
              error: null,
              isPaused: !canFetch(this.options.networkMode),
              status: "loading",
              variables: action.variables
            };
          case "success":
            return {
              ...state,
              data: action.data,
              error: null,
              status: "success",
              isPaused: false
            };
          case "error":
            return {
              ...state,
              data: void 0,
              error: action.error,
              failureCount: state.failureCount + 1,
              isPaused: false,
              status: "error"
            };
          case "setState":
            return {
              ...state,
              ...action.state
            };
        }
      };
      this.state = reducer(this.state);
      notifyManager.batch(() => {
        this.observers.forEach((observer) => {
          observer.onMutationUpdate(action);
        });
        this.mutationCache.notify({
          mutation: this,
          type: "updated",
          action
        });
      });
    }
  }
  function getDefaultState() {
    return {
      context: void 0,
      data: void 0,
      error: null,
      failureCount: 0,
      isPaused: false,
      status: "idle",
      variables: void 0
    };
  }
  class MutationCache extends Subscribable {
    constructor(config) {
      super();
      this.config = config || {};
      this.mutations = [];
      this.mutationId = 0;
    }
    build(client, options, state) {
      const mutation = new Mutation({
        mutationCache: this,
        logger: client.getLogger(),
        mutationId: ++this.mutationId,
        options: client.defaultMutationOptions(options),
        state,
        defaultOptions: options.mutationKey ? client.getMutationDefaults(options.mutationKey) : void 0,
        meta: options.meta
      });
      this.add(mutation);
      return mutation;
    }
    add(mutation) {
      this.mutations.push(mutation);
      this.notify({
        type: "added",
        mutation
      });
    }
    remove(mutation) {
      this.mutations = this.mutations.filter((x) => x !== mutation);
      this.notify({
        type: "removed",
        mutation
      });
    }
    clear() {
      notifyManager.batch(() => {
        this.mutations.forEach((mutation) => {
          this.remove(mutation);
        });
      });
    }
    getAll() {
      return this.mutations;
    }
    find(filters) {
      if (typeof filters.exact === "undefined") {
        filters.exact = true;
      }
      return this.mutations.find((mutation) => matchMutation(filters, mutation));
    }
    findAll(filters) {
      return this.mutations.filter((mutation) => matchMutation(filters, mutation));
    }
    notify(event) {
      notifyManager.batch(() => {
        this.listeners.forEach((listener) => {
          listener(event);
        });
      });
    }
    resumePausedMutations() {
      const pausedMutations = this.mutations.filter((x) => x.state.isPaused);
      return notifyManager.batch(() => pausedMutations.reduce((promise, mutation) => promise.then(() => mutation.continue().catch(noop$1)), Promise.resolve()));
    }
  }
  function infiniteQueryBehavior() {
    return {
      onFetch: (context) => {
        context.fetchFn = () => {
          var _context$fetchOptions, _context$fetchOptions2, _context$fetchOptions3, _context$fetchOptions4, _context$state$data, _context$state$data2;
          const refetchPage = (_context$fetchOptions = context.fetchOptions) == null ? void 0 : (_context$fetchOptions2 = _context$fetchOptions.meta) == null ? void 0 : _context$fetchOptions2.refetchPage;
          const fetchMore = (_context$fetchOptions3 = context.fetchOptions) == null ? void 0 : (_context$fetchOptions4 = _context$fetchOptions3.meta) == null ? void 0 : _context$fetchOptions4.fetchMore;
          const pageParam = fetchMore == null ? void 0 : fetchMore.pageParam;
          const isFetchingNextPage = (fetchMore == null ? void 0 : fetchMore.direction) === "forward";
          const isFetchingPreviousPage = (fetchMore == null ? void 0 : fetchMore.direction) === "backward";
          const oldPages = ((_context$state$data = context.state.data) == null ? void 0 : _context$state$data.pages) || [];
          const oldPageParams = ((_context$state$data2 = context.state.data) == null ? void 0 : _context$state$data2.pageParams) || [];
          let newPageParams = oldPageParams;
          let cancelled = false;
          const addSignalProperty = (object) => {
            Object.defineProperty(object, "signal", {
              enumerable: true,
              get: () => {
                var _context$signal;
                if ((_context$signal = context.signal) != null && _context$signal.aborted) {
                  cancelled = true;
                } else {
                  var _context$signal2;
                  (_context$signal2 = context.signal) == null ? void 0 : _context$signal2.addEventListener("abort", () => {
                    cancelled = true;
                  });
                }
                return context.signal;
              }
            });
          };
          const queryFn = context.options.queryFn || (() => Promise.reject("Missing queryFn"));
          const buildNewPages = (pages, param, page, previous) => {
            newPageParams = previous ? [param, ...newPageParams] : [...newPageParams, param];
            return previous ? [page, ...pages] : [...pages, page];
          };
          const fetchPage = (pages, manual, param, previous) => {
            if (cancelled) {
              return Promise.reject("Cancelled");
            }
            if (typeof param === "undefined" && !manual && pages.length) {
              return Promise.resolve(pages);
            }
            const queryFnContext = {
              queryKey: context.queryKey,
              pageParam: param,
              meta: context.meta
            };
            addSignalProperty(queryFnContext);
            const queryFnResult = queryFn(queryFnContext);
            const promise2 = Promise.resolve(queryFnResult).then((page) => buildNewPages(pages, param, page, previous));
            return promise2;
          };
          let promise;
          if (!oldPages.length) {
            promise = fetchPage([]);
          } else if (isFetchingNextPage) {
            const manual = typeof pageParam !== "undefined";
            const param = manual ? pageParam : getNextPageParam(context.options, oldPages);
            promise = fetchPage(oldPages, manual, param);
          } else if (isFetchingPreviousPage) {
            const manual = typeof pageParam !== "undefined";
            const param = manual ? pageParam : getPreviousPageParam(context.options, oldPages);
            promise = fetchPage(oldPages, manual, param, true);
          } else {
            newPageParams = [];
            const manual = typeof context.options.getNextPageParam === "undefined";
            const shouldFetchFirstPage = refetchPage && oldPages[0] ? refetchPage(oldPages[0], 0, oldPages) : true;
            promise = shouldFetchFirstPage ? fetchPage([], manual, oldPageParams[0]) : Promise.resolve(buildNewPages([], oldPageParams[0], oldPages[0]));
            for (let i = 1; i < oldPages.length; i++) {
              promise = promise.then((pages) => {
                const shouldFetchNextPage = refetchPage && oldPages[i] ? refetchPage(oldPages[i], i, oldPages) : true;
                if (shouldFetchNextPage) {
                  const param = manual ? oldPageParams[i] : getNextPageParam(context.options, pages);
                  return fetchPage(pages, manual, param);
                }
                return Promise.resolve(buildNewPages(pages, oldPageParams[i], oldPages[i]));
              });
            }
          }
          const finalPromise = promise.then((pages) => ({
            pages,
            pageParams: newPageParams
          }));
          return finalPromise;
        };
      }
    };
  }
  function getNextPageParam(options, pages) {
    return options.getNextPageParam == null ? void 0 : options.getNextPageParam(pages[pages.length - 1], pages);
  }
  function getPreviousPageParam(options, pages) {
    return options.getPreviousPageParam == null ? void 0 : options.getPreviousPageParam(pages[0], pages);
  }
  class QueryClient {
    constructor(config = {}) {
      this.queryCache = config.queryCache || new QueryCache();
      this.mutationCache = config.mutationCache || new MutationCache();
      this.logger = config.logger || defaultLogger;
      this.defaultOptions = config.defaultOptions || {};
      this.queryDefaults = [];
      this.mutationDefaults = [];
    }
    mount() {
      this.unsubscribeFocus = focusManager.subscribe(() => {
        if (focusManager.isFocused()) {
          this.resumePausedMutations();
          this.queryCache.onFocus();
        }
      });
      this.unsubscribeOnline = onlineManager.subscribe(() => {
        if (onlineManager.isOnline()) {
          this.resumePausedMutations();
          this.queryCache.onOnline();
        }
      });
    }
    unmount() {
      var _this$unsubscribeFocu, _this$unsubscribeOnli;
      (_this$unsubscribeFocu = this.unsubscribeFocus) == null ? void 0 : _this$unsubscribeFocu.call(this);
      (_this$unsubscribeOnli = this.unsubscribeOnline) == null ? void 0 : _this$unsubscribeOnli.call(this);
    }
    isFetching(arg1, arg2) {
      const [filters] = parseFilterArgs(arg1, arg2);
      filters.fetchStatus = "fetching";
      return this.queryCache.findAll(filters).length;
    }
    isMutating(filters) {
      return this.mutationCache.findAll({
        ...filters,
        fetching: true
      }).length;
    }
    getQueryData(queryKey, filters) {
      var _this$queryCache$find;
      return (_this$queryCache$find = this.queryCache.find(queryKey, filters)) == null ? void 0 : _this$queryCache$find.state.data;
    }
    getQueriesData(queryKeyOrFilters) {
      return this.getQueryCache().findAll(queryKeyOrFilters).map(({
        queryKey,
        state
      }) => {
        const data = state.data;
        return [queryKey, data];
      });
    }
    setQueryData(queryKey, updater, options) {
      const query = this.queryCache.find(queryKey);
      const prevData = query == null ? void 0 : query.state.data;
      const data = functionalUpdate(updater, prevData);
      if (typeof data === "undefined") {
        return void 0;
      }
      const parsedOptions = parseQueryArgs$1(queryKey);
      const defaultedOptions = this.defaultQueryOptions(parsedOptions);
      return this.queryCache.build(this, defaultedOptions).setData(data, {
        ...options,
        manual: true
      });
    }
    setQueriesData(queryKeyOrFilters, updater, options) {
      return notifyManager.batch(() => this.getQueryCache().findAll(queryKeyOrFilters).map(({
        queryKey
      }) => [queryKey, this.setQueryData(queryKey, updater, options)]));
    }
    getQueryState(queryKey, filters) {
      var _this$queryCache$find2;
      return (_this$queryCache$find2 = this.queryCache.find(queryKey, filters)) == null ? void 0 : _this$queryCache$find2.state;
    }
    removeQueries(arg1, arg2) {
      const [filters] = parseFilterArgs(arg1, arg2);
      const queryCache = this.queryCache;
      notifyManager.batch(() => {
        queryCache.findAll(filters).forEach((query) => {
          queryCache.remove(query);
        });
      });
    }
    resetQueries(arg1, arg2, arg3) {
      const [filters, options] = parseFilterArgs(arg1, arg2, arg3);
      const queryCache = this.queryCache;
      const refetchFilters = {
        type: "active",
        ...filters
      };
      return notifyManager.batch(() => {
        queryCache.findAll(filters).forEach((query) => {
          query.reset();
        });
        return this.refetchQueries(refetchFilters, options);
      });
    }
    cancelQueries(arg1, arg2, arg3) {
      const [filters, cancelOptions = {}] = parseFilterArgs(arg1, arg2, arg3);
      if (typeof cancelOptions.revert === "undefined") {
        cancelOptions.revert = true;
      }
      const promises = notifyManager.batch(() => this.queryCache.findAll(filters).map((query) => query.cancel(cancelOptions)));
      return Promise.all(promises).then(noop$1).catch(noop$1);
    }
    invalidateQueries(arg1, arg2, arg3) {
      const [filters, options] = parseFilterArgs(arg1, arg2, arg3);
      return notifyManager.batch(() => {
        var _ref, _filters$refetchType;
        this.queryCache.findAll(filters).forEach((query) => {
          query.invalidate();
        });
        if (filters.refetchType === "none") {
          return Promise.resolve();
        }
        const refetchFilters = {
          ...filters,
          type: (_ref = (_filters$refetchType = filters.refetchType) != null ? _filters$refetchType : filters.type) != null ? _ref : "active"
        };
        return this.refetchQueries(refetchFilters, options);
      });
    }
    refetchQueries(arg1, arg2, arg3) {
      const [filters, options] = parseFilterArgs(arg1, arg2, arg3);
      const promises = notifyManager.batch(() => this.queryCache.findAll(filters).filter((query) => !query.isDisabled()).map((query) => {
        var _options$cancelRefetc;
        return query.fetch(void 0, {
          ...options,
          cancelRefetch: (_options$cancelRefetc = options == null ? void 0 : options.cancelRefetch) != null ? _options$cancelRefetc : true,
          meta: {
            refetchPage: filters.refetchPage
          }
        });
      }));
      let promise = Promise.all(promises).then(noop$1);
      if (!(options != null && options.throwOnError)) {
        promise = promise.catch(noop$1);
      }
      return promise;
    }
    fetchQuery(arg1, arg2, arg3) {
      const parsedOptions = parseQueryArgs$1(arg1, arg2, arg3);
      const defaultedOptions = this.defaultQueryOptions(parsedOptions);
      if (typeof defaultedOptions.retry === "undefined") {
        defaultedOptions.retry = false;
      }
      const query = this.queryCache.build(this, defaultedOptions);
      return query.isStaleByTime(defaultedOptions.staleTime) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
    }
    prefetchQuery(arg1, arg2, arg3) {
      return this.fetchQuery(arg1, arg2, arg3).then(noop$1).catch(noop$1);
    }
    fetchInfiniteQuery(arg1, arg2, arg3) {
      const parsedOptions = parseQueryArgs$1(arg1, arg2, arg3);
      parsedOptions.behavior = infiniteQueryBehavior();
      return this.fetchQuery(parsedOptions);
    }
    prefetchInfiniteQuery(arg1, arg2, arg3) {
      return this.fetchInfiniteQuery(arg1, arg2, arg3).then(noop$1).catch(noop$1);
    }
    resumePausedMutations() {
      return this.mutationCache.resumePausedMutations();
    }
    getQueryCache() {
      return this.queryCache;
    }
    getMutationCache() {
      return this.mutationCache;
    }
    getLogger() {
      return this.logger;
    }
    getDefaultOptions() {
      return this.defaultOptions;
    }
    setDefaultOptions(options) {
      this.defaultOptions = options;
    }
    setQueryDefaults(queryKey, options) {
      const result = this.queryDefaults.find((x) => hashQueryKey(queryKey) === hashQueryKey(x.queryKey));
      if (result) {
        result.defaultOptions = options;
      } else {
        this.queryDefaults.push({
          queryKey,
          defaultOptions: options
        });
      }
    }
    getQueryDefaults(queryKey) {
      if (!queryKey) {
        return void 0;
      }
      const firstMatchingDefaults = this.queryDefaults.find((x) => partialMatchKey(queryKey, x.queryKey));
      return firstMatchingDefaults == null ? void 0 : firstMatchingDefaults.defaultOptions;
    }
    setMutationDefaults(mutationKey, options) {
      const result = this.mutationDefaults.find((x) => hashQueryKey(mutationKey) === hashQueryKey(x.mutationKey));
      if (result) {
        result.defaultOptions = options;
      } else {
        this.mutationDefaults.push({
          mutationKey,
          defaultOptions: options
        });
      }
    }
    getMutationDefaults(mutationKey) {
      if (!mutationKey) {
        return void 0;
      }
      const firstMatchingDefaults = this.mutationDefaults.find((x) => partialMatchKey(mutationKey, x.mutationKey));
      return firstMatchingDefaults == null ? void 0 : firstMatchingDefaults.defaultOptions;
    }
    defaultQueryOptions(options) {
      if (options != null && options._defaulted) {
        return options;
      }
      const defaultedOptions = {
        ...this.defaultOptions.queries,
        ...this.getQueryDefaults(options == null ? void 0 : options.queryKey),
        ...options,
        _defaulted: true
      };
      if (!defaultedOptions.queryHash && defaultedOptions.queryKey) {
        defaultedOptions.queryHash = hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
      }
      if (typeof defaultedOptions.refetchOnReconnect === "undefined") {
        defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
      }
      if (typeof defaultedOptions.useErrorBoundary === "undefined") {
        defaultedOptions.useErrorBoundary = !!defaultedOptions.suspense;
      }
      return defaultedOptions;
    }
    defaultMutationOptions(options) {
      if (options != null && options._defaulted) {
        return options;
      }
      return {
        ...this.defaultOptions.mutations,
        ...this.getMutationDefaults(options == null ? void 0 : options.mutationKey),
        ...options,
        _defaulted: true
      };
    }
    clear() {
      this.queryCache.clear();
      this.mutationCache.clear();
    }
  }
  class QueryObserver extends Subscribable {
    constructor(client, options) {
      super();
      this.client = client;
      this.options = options;
      this.trackedProps = /* @__PURE__ */ new Set();
      this.selectError = null;
      this.bindMethods();
      this.setOptions(options);
    }
    bindMethods() {
      this.remove = this.remove.bind(this);
      this.refetch = this.refetch.bind(this);
    }
    onSubscribe() {
      if (this.listeners.length === 1) {
        this.currentQuery.addObserver(this);
        if (shouldFetchOnMount(this.currentQuery, this.options)) {
          this.executeFetch();
        }
        this.updateTimers();
      }
    }
    onUnsubscribe() {
      if (!this.listeners.length) {
        this.destroy();
      }
    }
    shouldFetchOnReconnect() {
      return shouldFetchOn(this.currentQuery, this.options, this.options.refetchOnReconnect);
    }
    shouldFetchOnWindowFocus() {
      return shouldFetchOn(this.currentQuery, this.options, this.options.refetchOnWindowFocus);
    }
    destroy() {
      this.listeners = [];
      this.clearStaleTimeout();
      this.clearRefetchInterval();
      this.currentQuery.removeObserver(this);
    }
    setOptions(options, notifyOptions) {
      const prevOptions = this.options;
      const prevQuery = this.currentQuery;
      this.options = this.client.defaultQueryOptions(options);
      if (!shallowEqualObjects(prevOptions, this.options)) {
        this.client.getQueryCache().notify({
          type: "observerOptionsUpdated",
          query: this.currentQuery,
          observer: this
        });
      }
      if (typeof this.options.enabled !== "undefined" && typeof this.options.enabled !== "boolean") {
        throw new Error("Expected enabled to be a boolean");
      }
      if (!this.options.queryKey) {
        this.options.queryKey = prevOptions.queryKey;
      }
      this.updateQuery();
      const mounted = this.hasListeners();
      if (mounted && shouldFetchOptionally(this.currentQuery, prevQuery, this.options, prevOptions)) {
        this.executeFetch();
      }
      this.updateResult(notifyOptions);
      if (mounted && (this.currentQuery !== prevQuery || this.options.enabled !== prevOptions.enabled || this.options.staleTime !== prevOptions.staleTime)) {
        this.updateStaleTimeout();
      }
      const nextRefetchInterval = this.computeRefetchInterval();
      if (mounted && (this.currentQuery !== prevQuery || this.options.enabled !== prevOptions.enabled || nextRefetchInterval !== this.currentRefetchInterval)) {
        this.updateRefetchInterval(nextRefetchInterval);
      }
    }
    getOptimisticResult(options) {
      const query = this.client.getQueryCache().build(this.client, options);
      return this.createResult(query, options);
    }
    getCurrentResult() {
      return this.currentResult;
    }
    trackResult(result) {
      const trackedResult = {};
      Object.keys(result).forEach((key) => {
        Object.defineProperty(trackedResult, key, {
          configurable: false,
          enumerable: true,
          get: () => {
            this.trackedProps.add(key);
            return result[key];
          }
        });
      });
      return trackedResult;
    }
    getCurrentQuery() {
      return this.currentQuery;
    }
    remove() {
      this.client.getQueryCache().remove(this.currentQuery);
    }
    refetch({
      refetchPage,
      ...options
    } = {}) {
      return this.fetch({
        ...options,
        meta: {
          refetchPage
        }
      });
    }
    fetchOptimistic(options) {
      const defaultedOptions = this.client.defaultQueryOptions(options);
      const query = this.client.getQueryCache().build(this.client, defaultedOptions);
      query.isFetchingOptimistic = true;
      return query.fetch().then(() => this.createResult(query, defaultedOptions));
    }
    fetch(fetchOptions) {
      var _fetchOptions$cancelR;
      return this.executeFetch({
        ...fetchOptions,
        cancelRefetch: (_fetchOptions$cancelR = fetchOptions.cancelRefetch) != null ? _fetchOptions$cancelR : true
      }).then(() => {
        this.updateResult();
        return this.currentResult;
      });
    }
    executeFetch(fetchOptions) {
      this.updateQuery();
      let promise = this.currentQuery.fetch(this.options, fetchOptions);
      if (!(fetchOptions != null && fetchOptions.throwOnError)) {
        promise = promise.catch(noop$1);
      }
      return promise;
    }
    updateStaleTimeout() {
      this.clearStaleTimeout();
      if (isServer || this.currentResult.isStale || !isValidTimeout(this.options.staleTime)) {
        return;
      }
      const time = timeUntilStale(this.currentResult.dataUpdatedAt, this.options.staleTime);
      const timeout = time + 1;
      this.staleTimeoutId = setTimeout(() => {
        if (!this.currentResult.isStale) {
          this.updateResult();
        }
      }, timeout);
    }
    computeRefetchInterval() {
      var _this$options$refetch;
      return typeof this.options.refetchInterval === "function" ? this.options.refetchInterval(this.currentResult.data, this.currentQuery) : (_this$options$refetch = this.options.refetchInterval) != null ? _this$options$refetch : false;
    }
    updateRefetchInterval(nextInterval) {
      this.clearRefetchInterval();
      this.currentRefetchInterval = nextInterval;
      if (isServer || this.options.enabled === false || !isValidTimeout(this.currentRefetchInterval) || this.currentRefetchInterval === 0) {
        return;
      }
      this.refetchIntervalId = setInterval(() => {
        if (this.options.refetchIntervalInBackground || focusManager.isFocused()) {
          this.executeFetch();
        }
      }, this.currentRefetchInterval);
    }
    updateTimers() {
      this.updateStaleTimeout();
      this.updateRefetchInterval(this.computeRefetchInterval());
    }
    clearStaleTimeout() {
      if (this.staleTimeoutId) {
        clearTimeout(this.staleTimeoutId);
        this.staleTimeoutId = void 0;
      }
    }
    clearRefetchInterval() {
      if (this.refetchIntervalId) {
        clearInterval(this.refetchIntervalId);
        this.refetchIntervalId = void 0;
      }
    }
    createResult(query, options) {
      const prevQuery = this.currentQuery;
      const prevOptions = this.options;
      const prevResult = this.currentResult;
      const prevResultState = this.currentResultState;
      const prevResultOptions = this.currentResultOptions;
      const queryChange = query !== prevQuery;
      const queryInitialState = queryChange ? query.state : this.currentQueryInitialState;
      const prevQueryResult = queryChange ? this.currentResult : this.previousQueryResult;
      const {
        state
      } = query;
      let {
        dataUpdatedAt,
        error,
        errorUpdatedAt,
        fetchStatus,
        status
      } = state;
      let isPreviousData = false;
      let isPlaceholderData = false;
      let data;
      if (options._optimisticResults) {
        const mounted = this.hasListeners();
        const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
        const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
        if (fetchOnMount || fetchOptionally) {
          fetchStatus = canFetch(query.options.networkMode) ? "fetching" : "paused";
          if (!dataUpdatedAt) {
            status = "loading";
          }
        }
        if (options._optimisticResults === "isRestoring") {
          fetchStatus = "idle";
        }
      }
      if (options.keepPreviousData && !state.dataUpdateCount && prevQueryResult != null && prevQueryResult.isSuccess && status !== "error") {
        data = prevQueryResult.data;
        dataUpdatedAt = prevQueryResult.dataUpdatedAt;
        status = prevQueryResult.status;
        isPreviousData = true;
      } else if (options.select && typeof state.data !== "undefined") {
        if (prevResult && state.data === (prevResultState == null ? void 0 : prevResultState.data) && options.select === this.selectFn) {
          data = this.selectResult;
        } else {
          try {
            this.selectFn = options.select;
            data = options.select(state.data);
            data = replaceData(prevResult == null ? void 0 : prevResult.data, data, options);
            this.selectResult = data;
            this.selectError = null;
          } catch (selectError) {
            this.selectError = selectError;
          }
        }
      } else {
        data = state.data;
      }
      if (typeof options.placeholderData !== "undefined" && typeof data === "undefined" && status === "loading") {
        let placeholderData;
        if (prevResult != null && prevResult.isPlaceholderData && options.placeholderData === (prevResultOptions == null ? void 0 : prevResultOptions.placeholderData)) {
          placeholderData = prevResult.data;
        } else {
          placeholderData = typeof options.placeholderData === "function" ? options.placeholderData() : options.placeholderData;
          if (options.select && typeof placeholderData !== "undefined") {
            try {
              placeholderData = options.select(placeholderData);
              placeholderData = replaceData(prevResult == null ? void 0 : prevResult.data, placeholderData, options);
              this.selectError = null;
            } catch (selectError) {
              this.selectError = selectError;
            }
          }
        }
        if (typeof placeholderData !== "undefined") {
          status = "success";
          data = placeholderData;
          isPlaceholderData = true;
        }
      }
      if (this.selectError) {
        error = this.selectError;
        data = this.selectResult;
        errorUpdatedAt = Date.now();
        status = "error";
      }
      const isFetching = fetchStatus === "fetching";
      const result = {
        status,
        fetchStatus,
        isLoading: status === "loading",
        isSuccess: status === "success",
        isError: status === "error",
        data,
        dataUpdatedAt,
        error,
        errorUpdatedAt,
        failureCount: state.fetchFailureCount,
        errorUpdateCount: state.errorUpdateCount,
        isFetched: state.dataUpdateCount > 0 || state.errorUpdateCount > 0,
        isFetchedAfterMount: state.dataUpdateCount > queryInitialState.dataUpdateCount || state.errorUpdateCount > queryInitialState.errorUpdateCount,
        isFetching,
        isRefetching: isFetching && status !== "loading",
        isLoadingError: status === "error" && state.dataUpdatedAt === 0,
        isPaused: fetchStatus === "paused",
        isPlaceholderData,
        isPreviousData,
        isRefetchError: status === "error" && state.dataUpdatedAt !== 0,
        isStale: isStale(query, options),
        refetch: this.refetch,
        remove: this.remove
      };
      return result;
    }
    updateResult(notifyOptions) {
      const prevResult = this.currentResult;
      const nextResult = this.createResult(this.currentQuery, this.options);
      this.currentResultState = this.currentQuery.state;
      this.currentResultOptions = this.options;
      if (shallowEqualObjects(nextResult, prevResult)) {
        return;
      }
      this.currentResult = nextResult;
      const defaultNotifyOptions = {
        cache: true
      };
      const shouldNotifyListeners = () => {
        if (!prevResult) {
          return true;
        }
        const {
          notifyOnChangeProps
        } = this.options;
        if (notifyOnChangeProps === "all" || !notifyOnChangeProps && !this.trackedProps.size) {
          return true;
        }
        const includedProps = new Set(notifyOnChangeProps != null ? notifyOnChangeProps : this.trackedProps);
        if (this.options.useErrorBoundary) {
          includedProps.add("error");
        }
        return Object.keys(this.currentResult).some((key) => {
          const typedKey = key;
          const changed = this.currentResult[typedKey] !== prevResult[typedKey];
          return changed && includedProps.has(typedKey);
        });
      };
      if ((notifyOptions == null ? void 0 : notifyOptions.listeners) !== false && shouldNotifyListeners()) {
        defaultNotifyOptions.listeners = true;
      }
      this.notify({
        ...defaultNotifyOptions,
        ...notifyOptions
      });
    }
    updateQuery() {
      const query = this.client.getQueryCache().build(this.client, this.options);
      if (query === this.currentQuery) {
        return;
      }
      const prevQuery = this.currentQuery;
      this.currentQuery = query;
      this.currentQueryInitialState = query.state;
      this.previousQueryResult = this.currentResult;
      if (this.hasListeners()) {
        prevQuery == null ? void 0 : prevQuery.removeObserver(this);
        query.addObserver(this);
      }
    }
    onQueryUpdate(action) {
      const notifyOptions = {};
      if (action.type === "success") {
        notifyOptions.onSuccess = !action.manual;
      } else if (action.type === "error" && !isCancelledError(action.error)) {
        notifyOptions.onError = true;
      }
      this.updateResult(notifyOptions);
      if (this.hasListeners()) {
        this.updateTimers();
      }
    }
    notify(notifyOptions) {
      notifyManager.batch(() => {
        if (notifyOptions.onSuccess) {
          var _this$options$onSucce, _this$options, _this$options$onSettl, _this$options2;
          (_this$options$onSucce = (_this$options = this.options).onSuccess) == null ? void 0 : _this$options$onSucce.call(_this$options, this.currentResult.data);
          (_this$options$onSettl = (_this$options2 = this.options).onSettled) == null ? void 0 : _this$options$onSettl.call(_this$options2, this.currentResult.data, null);
        } else if (notifyOptions.onError) {
          var _this$options$onError, _this$options3, _this$options$onSettl2, _this$options4;
          (_this$options$onError = (_this$options3 = this.options).onError) == null ? void 0 : _this$options$onError.call(_this$options3, this.currentResult.error);
          (_this$options$onSettl2 = (_this$options4 = this.options).onSettled) == null ? void 0 : _this$options$onSettl2.call(_this$options4, void 0, this.currentResult.error);
        }
        if (notifyOptions.listeners) {
          this.listeners.forEach((listener) => {
            listener(this.currentResult);
          });
        }
        if (notifyOptions.cache) {
          this.client.getQueryCache().notify({
            query: this.currentQuery,
            type: "observerResultsUpdated"
          });
        }
      });
    }
  }
  function shouldLoadOnMount(query, options) {
    return options.enabled !== false && !query.state.dataUpdatedAt && !(query.state.status === "error" && options.retryOnMount === false);
  }
  function shouldFetchOnMount(query, options) {
    return shouldLoadOnMount(query, options) || query.state.dataUpdatedAt > 0 && shouldFetchOn(query, options, options.refetchOnMount);
  }
  function shouldFetchOn(query, options, field) {
    if (options.enabled !== false) {
      const value = typeof field === "function" ? field(query) : field;
      return value === "always" || value !== false && isStale(query, options);
    }
    return false;
  }
  function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
    return options.enabled !== false && (query !== prevQuery || prevOptions.enabled === false) && (!options.suspense || query.state.status !== "error") && isStale(query, options);
  }
  function isStale(query, options) {
    return query.isStaleByTime(options.staleTime);
  }
  class MutationObserver$1 extends Subscribable {
    constructor(client, options) {
      super();
      this.client = client;
      this.setOptions(options);
      this.bindMethods();
      this.updateResult();
    }
    bindMethods() {
      this.mutate = this.mutate.bind(this);
      this.reset = this.reset.bind(this);
    }
    setOptions(options) {
      const prevOptions = this.options;
      this.options = this.client.defaultMutationOptions(options);
      if (!shallowEqualObjects(prevOptions, this.options)) {
        this.client.getMutationCache().notify({
          type: "observerOptionsUpdated",
          mutation: this.currentMutation,
          observer: this
        });
      }
    }
    onUnsubscribe() {
      if (!this.listeners.length) {
        var _this$currentMutation;
        (_this$currentMutation = this.currentMutation) == null ? void 0 : _this$currentMutation.removeObserver(this);
      }
    }
    onMutationUpdate(action) {
      this.updateResult();
      const notifyOptions = {
        listeners: true
      };
      if (action.type === "success") {
        notifyOptions.onSuccess = true;
      } else if (action.type === "error") {
        notifyOptions.onError = true;
      }
      this.notify(notifyOptions);
    }
    getCurrentResult() {
      return this.currentResult;
    }
    reset() {
      this.currentMutation = void 0;
      this.updateResult();
      this.notify({
        listeners: true
      });
    }
    mutate(variables, options) {
      this.mutateOptions = options;
      if (this.currentMutation) {
        this.currentMutation.removeObserver(this);
      }
      this.currentMutation = this.client.getMutationCache().build(this.client, {
        ...this.options,
        variables: typeof variables !== "undefined" ? variables : this.options.variables
      });
      this.currentMutation.addObserver(this);
      return this.currentMutation.execute();
    }
    updateResult() {
      const state = this.currentMutation ? this.currentMutation.state : getDefaultState();
      const result = {
        ...state,
        isLoading: state.status === "loading",
        isSuccess: state.status === "success",
        isError: state.status === "error",
        isIdle: state.status === "idle",
        mutate: this.mutate,
        reset: this.reset
      };
      this.currentResult = result;
    }
    notify(options) {
      notifyManager.batch(() => {
        if (this.mutateOptions) {
          if (options.onSuccess) {
            var _this$mutateOptions$o, _this$mutateOptions, _this$mutateOptions$o2, _this$mutateOptions2;
            (_this$mutateOptions$o = (_this$mutateOptions = this.mutateOptions).onSuccess) == null ? void 0 : _this$mutateOptions$o.call(_this$mutateOptions, this.currentResult.data, this.currentResult.variables, this.currentResult.context);
            (_this$mutateOptions$o2 = (_this$mutateOptions2 = this.mutateOptions).onSettled) == null ? void 0 : _this$mutateOptions$o2.call(_this$mutateOptions2, this.currentResult.data, null, this.currentResult.variables, this.currentResult.context);
          } else if (options.onError) {
            var _this$mutateOptions$o3, _this$mutateOptions3, _this$mutateOptions$o4, _this$mutateOptions4;
            (_this$mutateOptions$o3 = (_this$mutateOptions3 = this.mutateOptions).onError) == null ? void 0 : _this$mutateOptions$o3.call(_this$mutateOptions3, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
            (_this$mutateOptions$o4 = (_this$mutateOptions4 = this.mutateOptions).onSettled) == null ? void 0 : _this$mutateOptions$o4.call(_this$mutateOptions4, void 0, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
          }
        }
        if (options.listeners) {
          this.listeners.forEach((listener) => {
            listener(this.currentResult);
          });
        }
      });
    }
  }
  const $RAW = Symbol("store-raw"), $NODE = Symbol("store-node"), $NAME = Symbol("store-name");
  function wrap$1(value, name) {
    let p = value[$PROXY];
    if (!p) {
      Object.defineProperty(value, $PROXY, {
        value: p = new Proxy(value, proxyTraps$1)
      });
      const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
      for (let i = 0, l = keys.length; i < l; i++) {
        const prop = keys[i];
        if (desc[prop].get) {
          const get = desc[prop].get.bind(p);
          Object.defineProperty(value, prop, {
            get
          });
        }
      }
    }
    return p;
  }
  function isWrappable(obj) {
    let proto;
    return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
  }
  function unwrap(item, set = /* @__PURE__ */ new Set()) {
    let result, unwrapped, v, prop;
    if (result = item != null && item[$RAW])
      return result;
    if (!isWrappable(item) || set.has(item))
      return item;
    if (Array.isArray(item)) {
      if (Object.isFrozen(item))
        item = item.slice(0);
      else
        set.add(item);
      for (let i = 0, l = item.length; i < l; i++) {
        v = item[i];
        if ((unwrapped = unwrap(v, set)) !== v)
          item[i] = unwrapped;
      }
    } else {
      if (Object.isFrozen(item))
        item = Object.assign({}, item);
      else
        set.add(item);
      const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
      for (let i = 0, l = keys.length; i < l; i++) {
        prop = keys[i];
        if (desc[prop].get)
          continue;
        v = item[prop];
        if ((unwrapped = unwrap(v, set)) !== v)
          item[prop] = unwrapped;
      }
    }
    return item;
  }
  function getDataNodes(target) {
    let nodes = target[$NODE];
    if (!nodes)
      Object.defineProperty(target, $NODE, {
        value: nodes = {}
      });
    return nodes;
  }
  function getDataNode(nodes, property, value) {
    return nodes[property] || (nodes[property] = createDataNode(value, true));
  }
  function proxyDescriptor(target, property) {
    const desc = Reflect.getOwnPropertyDescriptor(target, property);
    if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE || property === $NAME)
      return desc;
    delete desc.value;
    delete desc.writable;
    desc.get = () => target[$PROXY][property];
    return desc;
  }
  function trackSelf(target) {
    if (getListener()) {
      const nodes = getDataNodes(target);
      (nodes._ || (nodes._ = createDataNode()))();
    }
  }
  function ownKeys(target) {
    trackSelf(target);
    return Reflect.ownKeys(target);
  }
  function createDataNode(value, equals) {
    const [s, set] = createSignal(value, equals ? {
      internal: true
    } : {
      equals: false,
      internal: true
    });
    s.$ = set;
    return s;
  }
  const proxyTraps$1 = {
    get(target, property, receiver) {
      if (property === $RAW)
        return target;
      if (property === $PROXY)
        return receiver;
      if (property === $TRACK)
        return trackSelf(target);
      const nodes = getDataNodes(target);
      const tracked = nodes[property];
      let value = tracked ? nodes[property]() : target[property];
      if (property === $NODE || property === "__proto__")
        return value;
      if (!tracked) {
        const desc = Object.getOwnPropertyDescriptor(target, property);
        if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get))
          value = getDataNode(nodes, property, value)();
      }
      return isWrappable(value) ? wrap$1(value) : value;
    },
    set() {
      return true;
    },
    deleteProperty() {
      return true;
    },
    ownKeys,
    getOwnPropertyDescriptor: proxyDescriptor
  };
  function setProperty(state, property, value) {
    if (state[property] === value)
      return;
    const prev = state[property];
    const len = state.length;
    if (value === void 0) {
      delete state[property];
    } else
      state[property] = value;
    let nodes = getDataNodes(state), node;
    if (node = getDataNode(nodes, property, prev))
      node.$(() => value);
    if (Array.isArray(state) && state.length !== len)
      (node = getDataNode(nodes, "length", len)) && node.$(state.length);
    (node = nodes._) && node.$();
  }
  function mergeStoreNode(state, value) {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      setProperty(state, key, value[key]);
    }
  }
  function updateArray(current, next) {
    if (typeof next === "function")
      next = next(current);
    next = unwrap(next);
    if (Array.isArray(next)) {
      if (current === next)
        return;
      let i = 0, len = next.length;
      for (; i < len; i++) {
        const value = next[i];
        if (current[i] !== value)
          setProperty(current, i, value);
      }
      setProperty(current, "length", len);
    } else
      mergeStoreNode(current, next);
  }
  function updatePath(current, path, traversed = []) {
    let part, prev = current;
    if (path.length > 1) {
      part = path.shift();
      const partType = typeof part, isArray = Array.isArray(current);
      if (Array.isArray(part)) {
        for (let i = 0; i < part.length; i++) {
          updatePath(current, [part[i]].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "function") {
        for (let i = 0; i < current.length; i++) {
          if (part(current[i], i))
            updatePath(current, [i].concat(path), traversed);
        }
        return;
      } else if (isArray && partType === "object") {
        const {
          from = 0,
          to = current.length - 1,
          by = 1
        } = part;
        for (let i = from; i <= to; i += by) {
          updatePath(current, [i].concat(path), traversed);
        }
        return;
      } else if (path.length > 1) {
        updatePath(current[part], path, [part].concat(traversed));
        return;
      }
      prev = current[part];
      traversed = [part].concat(traversed);
    }
    let value = path[0];
    if (typeof value === "function") {
      value = value(prev, traversed);
      if (value === prev)
        return;
    }
    if (part === void 0 && value == void 0)
      return;
    value = unwrap(value);
    if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
      mergeStoreNode(prev, value);
    } else
      setProperty(current, part, value);
  }
  function createStore(store, options) {
    const unwrappedStore = unwrap(store || {});
    const isArray = Array.isArray(unwrappedStore);
    const wrappedStore = wrap$1(unwrappedStore);
    function setStore(...args) {
      batch(() => {
        isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
      });
    }
    return [wrappedStore, setStore];
  }
  function isQueryKey(value) {
    return typeof value === "function";
  }
  function parseQueryArgs(arg1, arg2, arg3) {
    if (!isQueryKey(arg1)) {
      const { queryKey: solidKey, ...opts } = arg1;
      if (solidKey) {
        return {
          ...opts,
          queryKey: solidKey()
        };
      }
      return arg1;
    }
    if (typeof arg2 === "function") {
      return { ...arg3, queryKey: arg1(), queryFn: arg2 };
    }
    return { ...arg2, queryKey: arg1() };
  }
  const QueryClientContext = createContext();
  const QueryClientSharingContext = createContext(false);
  const QueryClientProvider = (props) => {
    if (!props.client) {
      throw new Error("No queryClient found.");
    }
    onMount(() => props.client.mount());
    onCleanup(() => props.client.unmount());
    return createComponent(QueryClientContext.Provider, {
      get value() {
        return props.client;
      },
      get children() {
        return props.children;
      }
    });
  };
  function getQueryClientContext(context, contextSharing) {
    if (context) {
      return context;
    }
    if (contextSharing && typeof window !== "undefined") {
      if (!window.SolidQueryClientContext) {
        window.SolidQueryClientContext = QueryClientContext;
      }
      return window.SolidQueryClientContext;
    }
    return QueryClientContext;
  }
  const useQueryClient = ({
    context
  } = {}) => {
    const queryClient2 = useContext(getQueryClientContext(context, useContext(QueryClientSharingContext)));
    if (!queryClient2) {
      throw new Error("No QueryClient set, use QueryClientProvider to set one");
    }
    return queryClient2;
  };
  function createBaseQuery(options, Observer) {
    const queryClient2 = useQueryClient();
    const defaultedOptions = queryClient2.defaultQueryOptions(options);
    defaultedOptions._optimisticResults = "optimistic";
    const observer = new QueryObserver(queryClient2, defaultedOptions);
    const [state, setState] = createStore(observer.getOptimisticResult(defaultedOptions));
    const [dataResource, { refetch }] = createResource(() => {
      return new Promise((resolve, reject) => {
        if (state.isSuccess)
          resolve(state.data);
        if (state.isError && !state.isFetching) {
          throw state.error;
        }
      });
    });
    observer.updateResult();
    const unsubscribe = observer.subscribe((result) => {
      const reconciledResult = result;
      setState(reconciledResult);
      refetch();
    });
    onCleanup(() => unsubscribe());
    onMount(() => {
      observer.setOptions(defaultedOptions, { listeners: false });
    });
    createComputed(() => {
      const defaultedOptions2 = queryClient2.defaultQueryOptions(options);
      observer.setOptions(defaultedOptions2);
    });
    const handler = {
      get(target, prop) {
        if (prop === "data") {
          return dataResource();
        }
        return Reflect.get(target, prop);
      }
    };
    return new Proxy(state, handler);
  }
  function createQuery(arg1, arg2, arg3) {
    const [parsedOptions, setParsedOptions] = createStore(parseQueryArgs(arg1, arg2, arg3));
    createComputed(() => {
      const newParsedOptions = parseQueryArgs(arg1, arg2, arg3);
      setParsedOptions(newParsedOptions);
    });
    return createBaseQuery(parsedOptions);
  }
  function createMutation(arg1, arg2, arg3) {
    const [options, setOptions] = createStore(parseMutationArgs(arg1, arg2, arg3));
    const queryClient2 = useQueryClient({ context: options.context });
    const observer = new MutationObserver$1(queryClient2, options);
    const mutate = (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    };
    const [state, setState] = createStore({
      ...observer.getCurrentResult(),
      mutate,
      mutateAsync: observer.getCurrentResult().mutate
    });
    createComputed(() => {
      const newParsedOptions = parseMutationArgs(arg1, arg2, arg3);
      setOptions(newParsedOptions);
      observer.setOptions(newParsedOptions);
    });
    const unsubscribe = observer.subscribe((result) => {
      setState({
        ...result,
        mutate,
        mutateAsync: result.mutate
      });
    });
    onCleanup(unsubscribe);
    return state;
  }
  function noop() {
  }
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop().split(";").shift();
  }
  function getSkypeToken() {
    const skypeToken = getCookie("skypetoken_asm");
    return `skypetoken=${skypeToken}`;
  }
  function useReactionMutation() {
    const queryClient2 = useQueryClient();
    return createMutation(
      (props) => {
        const bodyObj = { emotions: { key: props.key, value: 1662588778832 } };
        return fetch(
          `https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${props.chatId}/messages/${props.messageId}/properties?name=emotions`,
          {
            credentials: "include",
            headers: {
              authentication: getSkypeToken()
            },
            body: JSON.stringify(bodyObj),
            method: "PUT",
            mode: "cors"
          }
        );
      },
      {
        async onMutate(variables) {
          await queryClient2.cancelQueries([
            "reactions",
            variables.chatId,
            variables.messageId
          ]);
        },
        async onSuccess(data, variables, context) {
          await queryClient2.invalidateQueries([
            "reactions",
            variables.chatId,
            variables.messageId
          ]);
        }
      }
    );
  }
  function useReactionsQuery(chatId, messageId) {
    return createQuery(
      () => ["reactions", chatId(), messageId],
      () => {
        log(
          "fetching",
          `https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${chatId()}/messages/${messageId}`
        );
        return fetch(
          `https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${chatId()}/messages/${messageId}`,
          {
            headers: {
              authentication: getSkypeToken()
            }
          }
        ).then((r) => {
          log("[Response]", r);
          return r.json();
        }).then((d) => {
          log("[Response data]", d);
          return d;
        }).catch((e) => {
          log("[Error]", e);
          throw e;
        });
      },
      { staleTime: 10 * 60 * 1e3 }
    );
  }
  const _tmpl$$2 = /* @__PURE__ */ template(`<div></div>`);
  const ReactionsList = (props) => {
    const [listComponent, setListComponent] = createSignal();
    createEffect(() => {
      var _a;
      if (((_a = props.emojiOverlayEl()) == null ? void 0 : _a.parentElement) === props.messageEl) {
        query.refetch();
      }
    });
    createEffect(() => {
      var _a, _b;
      (_b = (_a = listComponent()) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.removeChild(listComponent());
    });
    const messageId = props.messageEl.getAttribute("data-mid");
    const query = useReactionsQuery(props.chatId, messageId);
    const headEl = props.messageEl.querySelector('[class="ui-chat__messageheader"]');
    createEffect(() => {
      const listComponent_ = listComponent();
      if (!listComponent_)
        return;
      log("[ReactionList] listComponent() rendered appending to head");
      headEl == null ? void 0 : headEl.appendChild(listComponent_);
      onCleanup(() => headEl == null ? void 0 : headEl.removeChild(listComponent_));
    });
    return (() => {
      const _el$ = _tmpl$$2.cloneNode(true);
      use(setListComponent, _el$);
      insert(_el$, () => {
        var _a, _b, _c;
        return JSON.stringify((_c = (_b = (_a = query.data) == null ? void 0 : _a.annotationsSummary) == null ? void 0 : _b.emotions) != null ? _c : {});
      });
      return _el$;
    })();
  };
  const _tmpl$$1 = /* @__PURE__ */ template(`<div></div>`), _tmpl$2 = /* @__PURE__ */ template(`<div><button>+</button></div>`);
  function log(...args) {
    console.log("[CustomReactions]", ...args);
  }
  function isInDom(obj) {
    return document.documentElement.contains(obj);
  }
  function useCurrentChatId() {
    const [currentChatId, setCurrentChatId] = createSignal();
    createEffect(() => {
      const interval = setInterval(() => {
        var _a;
        const parsedCurrentChatId = (_a = new URL((top == null ? void 0 : top.location.href) || "").hash.match(/#\/conversations\/(.*)\?/)) == null ? void 0 : _a[1];
        setCurrentChatId(parsedCurrentChatId);
      });
      onCleanup(() => clearInterval(interval));
    });
    return currentChatId;
  }
  function useMessageElements() {
    const [messageElements, setMessageElements] = createSignal([]);
    createEffect(() => {
      const interval = setInterval(() => {
        const queriedMessageElements = document.querySelectorAll('[data-tid="chat-pane-message"]');
        const elementsWithMessageIds = Array.from(queriedMessageElements);
        setMessageElements(elementsWithMessageIds);
      }, 1e4);
      onCleanup(() => clearInterval(interval));
    });
    return messageElements;
  }
  const App = () => {
    var _a;
    const [customTypesBtn, setCustomTypesBtn] = createSignal();
    const [emojiOverlayEl, setEmojiOverlayEl] = createSignal((_a = document.querySelector('[data-tid="message-actions-container"]')) != null ? _a : void 0);
    createEffect(() => {
      const interval = setInterval(() => {
        const res = document.querySelector('[data-tid="message-actions-container"]');
        setEmojiOverlayEl(res != null ? res : void 0);
      }, 1e3);
      onCleanup(() => clearInterval(interval));
    });
    createEffect(() => {
      const emojiOverlay = emojiOverlayEl();
      waitForElmLazy('[data-tid="message-actions-container"]').then(setEmojiOverlayEl).catch(log);
      const customTypesB = customTypesBtn();
      if (!emojiOverlay)
        return;
      if (!customTypesB)
        return;
      log("Append custom button emojiOverlay.children[0].appendChild(customTypesB)", emojiOverlay, customTypesB);
      emojiOverlay.children[0].appendChild(customTypesB);
      onCleanup(() => {
        var _a2;
        log("REMOVE Append custom button emojiOverlay.children[0].appendChild(customTypesB)", emojiOverlay, customTypesB);
        (_a2 = customTypesB.parentElement) == null ? void 0 : _a2.removeChild(customTypesB);
      });
    });
    const mutation = useReactionMutation();
    const chatId = useCurrentChatId();
    createEffect(() => {
      var _a2, _b, _c;
      (_b = (_a2 = customTypesBtn()) == null ? void 0 : _a2.parentElement) == null ? void 0 : _b.removeChild(customTypesBtn());
      (_c = customTypesBtn()) == null ? void 0 : _c.addEventListener("click", () => {
        untrack(() => {
          var _a3, _b2;
          const chatId_ = chatId();
          if (!chatId_)
            return;
          const messageId = (_b2 = (_a3 = emojiOverlayEl()) == null ? void 0 : _a3.parentElement) == null ? void 0 : _b2.getAttribute("data-mid");
          if (!messageId)
            return;
          const result = prompt("enter reaction emoji here:", "\u{1F923}");
          if (!result)
            return;
          mutation.mutate({
            chatId: chatId_,
            messageId,
            key: result
          });
        });
      });
    });
    createEffect(() => {
      if (!emojiOverlayEl())
        return;
      const inter = setInterval(() => {
        if (!isInDom(emojiOverlayEl()))
          setEmojiOverlayEl(void 0);
      }, 500);
      onCleanup(() => clearInterval(inter));
    });
    const currentChatId = useCurrentChatId();
    const messageElements = useMessageElements();
    return [(() => {
      const _el$ = _tmpl$$1.cloneNode(true);
      insert(_el$, createComponent(Show, {
        when: () => !!currentChatId(),
        get children() {
          return createComponent(For, {
            get each() {
              return messageElements();
            },
            children: (el) => (() => {
              const _el$4 = _tmpl$$1.cloneNode(true);
              insert(_el$4, createComponent(ReactionsList, {
                chatId: currentChatId,
                messageEl: el,
                emojiOverlayEl
              }));
              return _el$4;
            })()
          });
        }
      }));
      return _el$;
    })(), (() => {
      const _el$2 = _tmpl$2.cloneNode(true), _el$3 = _el$2.firstChild;
      use(setCustomTypesBtn, _el$3);
      return _el$2;
    })()];
  };
  function waitForElmLazy(selector) {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        const mutationRes = document.querySelector(selector);
        if (mutationRes) {
          resolve(mutationRes);
          observer.disconnect();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
  const _tmpl$ = /* @__PURE__ */ template(`<div></div>`);
  const ErrorComponent = (error) => {
    log("[ERROR]", error);
    return (() => {
      const _el$ = _tmpl$.cloneNode(true);
      insert(_el$, () => JSON.stringify(error));
      return _el$;
    })();
  };
  const queryClient = new QueryClient({
    logger: {
      error(...args) {
        log("[Query Error]", ...args);
      },
      log(...args) {
        log("[Query Log]", ...args);
      },
      warn(...args) {
        log("[Query Warn]", ...args);
      }
    }
  });
  render(() => createComponent(ErrorBoundary, {
    fallback: (err) => createComponent(ErrorComponent, {
      error: err
    }),
    get children() {
      return createComponent(QueryClientProvider, {
        client: queryClient,
        get children() {
          return createComponent(App, {});
        }
      });
    }
  }), (() => {
    const app = document.createElement("div");
    document.body.append(app);
    return app;
  })());
})();
