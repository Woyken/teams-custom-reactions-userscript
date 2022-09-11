import { GM_addElement } from "$";
import { createMutation, createQuery } from "@adeora/solid-query";
import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
  untrack,
} from "solid-js";
import { useReactionMutation } from "./api";
import ReactionsList from "./ReactionsList";

export function log(...args: any) {
  console.log("[CustomReactions]", ...args);
}

function isInDom(obj: Element) {
  return document.documentElement.contains(obj);
}

function useCurrentChatId() {
  const [currentChatId, setCurrentChatId] = createSignal<string>();

  createEffect(() => {
    const interval = setInterval(() => {
      const parsedCurrentChatId = new URL(top?.location.href || "").hash.match(
        /#\/conversations\/(.*)\?/
      )?.[1];
      setCurrentChatId(parsedCurrentChatId);
    });
    onCleanup(() => clearInterval(interval));
  });

  return currentChatId;
}

function useMessageElements() {
  const [messageElements, setMessageElements] = createSignal<Element[]>([]);

  createEffect(() => {
    const interval = setInterval(() => {
      const queriedMessageElements = document.querySelectorAll(
        '[data-tid="chat-pane-message"]'
      );
      const elementsWithMessageIds = Array.from(queriedMessageElements);
      setMessageElements(elementsWithMessageIds);
    }, 10000);
    onCleanup(() => clearInterval(interval));
  });

  return messageElements;
}

const App: Component = () => {
  const [customTypesBtn, setCustomTypesBtn] = createSignal<HTMLDivElement>();

  const [emojiOverlayEl, setEmojiOverlayEl] = createSignal(
    document.querySelector('[data-tid="message-actions-container"]') ??
      undefined
  );

  createEffect(() => {
    const interval = setInterval(() => {
      const res = document.querySelector(
        '[data-tid="message-actions-container"]'
      );
      setEmojiOverlayEl(res ?? undefined);
    }, 1000);
    onCleanup(() => clearInterval(interval));
  });

  createEffect(() => {
    const emojiOverlay = emojiOverlayEl();
    // Wait for any changes to happen, maybe the popup will close, or new will open
    waitForElmLazy('[data-tid="message-actions-container"]')
      .then(setEmojiOverlayEl)
      .catch(log);
    const customTypesB = customTypesBtn();
    if (!emojiOverlay) return;
    if (!customTypesB) return;

    log(
      "Append custom button emojiOverlay.children[0].appendChild(customTypesB)",
      emojiOverlay,
      customTypesB
    );

    emojiOverlay.children[0].appendChild(customTypesB);
    onCleanup(() => {
      log(
        "REMOVE Append custom button emojiOverlay.children[0].appendChild(customTypesB)",
        emojiOverlay,
        customTypesB
      );
      customTypesB.parentElement?.removeChild(customTypesB);
    });

    // https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/19%3A3c482d78-77ad-4278-a83b-39c76e4bbf56_64e9785c-9d09-4a80-8f24-d8eaf14e5b9a%40unq.gbl.spaces/messages/1662635210100/properties?name=emotions&replace=true
  });

  const mutation = useReactionMutation();

  const chatId = useCurrentChatId();

  createEffect(() => {
    customTypesBtn()?.parentElement?.removeChild(customTypesBtn()!);
    customTypesBtn()?.addEventListener("click", () => {
      untrack(() => {
        const chatId_ = chatId();
        if (!chatId_) return;
        const messageId = emojiOverlayEl()?.parentElement?.getAttribute("data-mid");
        if (!messageId) return;
        const result = prompt("enter reaction emoji here:", "🤣");
        if (!result) return;

        mutation.mutate({ chatId: chatId_, messageId, key: result });
      })
    });
  });
  createEffect(() => {
    if (!emojiOverlayEl()) return;
    const inter = setInterval(() => {
      if (!isInDom(emojiOverlayEl()!)) setEmojiOverlayEl(undefined);
    }, 500);
    onCleanup(() => clearInterval(inter));
  });

  const currentChatId = useCurrentChatId();

  const messageElements = useMessageElements();
  return (
    <>
      <div>
        <Show when={() => !!currentChatId()}>
          <For each={messageElements()}>
            {(el) => (
              <div>
                <ReactionsList
                  chatId={currentChatId as Accessor<string>}
                  messageEl={el}
                  emojiOverlayEl={emojiOverlayEl}
                />
              </div>
            )}
          </For>
        </Show>
      </div>
      <div>
        <button ref={setCustomTypesBtn}>+</button>
      </div>
    </>
  );
};

export default App;

function waitForElmLazy(selector: string) {
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
      subtree: true,
    });
  });
}
