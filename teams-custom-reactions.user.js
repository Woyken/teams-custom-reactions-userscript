// ==UserScript==
// @name       teams-custom-reactions
// @namespace  npm/teams-custom-reactions
// @version    0.0.0
// @author     monkey
// @icon       https://vitejs.dev/logo.svg
// @match      https://teams.microsoft.com/multi-window/*
// ==/UserScript==

// use vite-plugin-monkey@2.3.1 at 2022-09-09T15:30:33.863Z

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
  function untrack(fn) {
    let result, listener = Listener;
    Listener = null;
    result = fn();
    Listener = listener;
    return result;
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
  function normalizeIncomingArray(normalized, array, current, unwrap) {
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
        if (unwrap) {
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
  const _tmpl$$2 = /* @__PURE__ */ template(`<div></div>`);
  function useReactionsQuery(chatId, messageId) {
    const [refetchCounter, setRefetchCounter] = createSignal(0);
    const [data, setData] = createSignal();
    createEffect(() => {
      log("[data, chatId, messageId]", chatId(), messageId, data());
    });
    createEffect(() => {
      refetchCounter();
      fetch(`https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${chatId()}/messages/${messageId}`, {
        headers: {
          authentication: getSkypeToken()
        }
      }).then((r) => r.json()).then(setData).catch((e) => log("[ERROR useReactionsQuery]", e));
    });
    return {
      data,
      refetch: () => setRefetchCounter((r) => r + 1)
    };
  }
  const ReactionsList = (props) => {
    const [listComponent, setListComponent] = createSignal();
    createEffect(() => {
      var _a;
      if (((_a = props.emojiOverlayEl()) == null ? void 0 : _a.parentElement) === props.messageEl) {
        refetch();
      }
    });
    createEffect(() => {
      var _a, _b;
      log("[Render ReactionList] removing parent for list ocmponent", listComponent());
      (_b = (_a = listComponent()) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.removeChild(listComponent());
    });
    log("[Render ReactionList]", props);
    const messageId = props.messageEl.getAttribute("data-mid");
    log("got messageId", messageId);
    const {
      data,
      refetch
    } = useReactionsQuery(props.chatId, messageId);
    log("data accessor", data);
    const headEl = props.messageEl.querySelector('[class="ui-chat__messageheader"]');
    log("head el", headEl);
    createEffect(() => {
      log("effect for listComponent appending", listComponent());
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
        return JSON.stringify((_c = (_b = (_a = data()) == null ? void 0 : _a.annotationsSummary) == null ? void 0 : _b.emotions) != null ? _c : {});
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
    const [customTypesBtn, setCustomTypesBtn] = createSignal();
    const [emojiOverlayEl, setEmojiOverlayEl] = createSignal();
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
        var _a;
        log("REMOVE Append custom button emojiOverlay.children[0].appendChild(customTypesB)", emojiOverlay, customTypesB);
        (_a = customTypesB.parentElement) == null ? void 0 : _a.removeChild(customTypesB);
      });
    });
    waitForElm('[data-tid="message-actions-container"]').then(setEmojiOverlayEl).catch(log);
    createEffect(() => {
      var _a, _b, _c;
      (_b = (_a = customTypesBtn()) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.removeChild(customTypesBtn());
      (_c = customTypesBtn()) == null ? void 0 : _c.addEventListener("click", () => {
        const result = prompt("enter reaction emoji here:", "\u{1F923}");
        if (!result)
          return;
        const bodyObj = {
          emotions: {
            key: result,
            value: 1662588778832
          }
        };
        fetch("https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/48%3Anotes/messages/1662584831346/properties?name=emotions", {
          credentials: "include",
          headers: {
            authentication: getSkypeToken()
          },
          body: JSON.stringify(bodyObj),
          method: "PUT",
          mode: "cors"
        }).then(log).catch(log);
      });
    });
    createEffect(() => {
      log("emojiOverlayEl exists waiting for it to dissapear", emojiOverlayEl());
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
  function waitForElm(selector) {
    return new Promise((resolve) => {
      const initialRes = document.querySelector(selector);
      if (initialRes) {
        return resolve(initialRes);
      }
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
  render(() => createComponent(ErrorBoundary, {
    fallback: (err) => createComponent(ErrorComponent, {
      error: err
    }),
    get children() {
      return createComponent(App, {});
    }
  }), (() => {
    const app = document.createElement("div");
    document.body.append(app);
    return app;
  })());
})();
