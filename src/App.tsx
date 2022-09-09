import { GM_addElement } from "$";
import { createQuery } from "@adeora/solid-query";
import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import ReactionsList from "./ReactionsList";

export function log(...args: any) {
  console.log("[CustomReactions]", ...args);
}

function isInDom(obj: Element) {
  return document.documentElement.contains(obj);
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift();
}

export function getSkypeToken() {
  const skypeToken = getCookie("skypetoken_asm");
  return `skypetoken=${skypeToken}`;
}

function useCurrentChatId() {
  const [currentChatId, setCurrentChatId] = createSignal<string>();

  // createEffect(() => {
  //   log("[currentChatId]", currentChatId());
  // });

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

  // createEffect(() => {
  //   log("[messageElements]", messageElements());
  // });

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

  const [emojiOverlayEl, setEmojiOverlayEl] = createSignal<Element>();

  // createEffect(() => {
  //   log("[emojiOverlayEl]", emojiOverlayEl());
  // });

  // createEffect(() => {
  //   log("[customTypesBtn]", customTypesBtn());
  // });

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

  waitForElm('[data-tid="message-actions-container"]')
    .then(setEmojiOverlayEl)
    .catch(log);

  createEffect(() => {
    customTypesBtn()?.parentElement?.removeChild(customTypesBtn()!);
    customTypesBtn()?.addEventListener("click", () => {
      const result = prompt("enter reaction emoji here:", "🤣");
      if (!result) return;

      const bodyObj = { emotions: { key: result, value: 1662588778832 } };

      fetch(
        "https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/48%3Anotes/messages/1662584831346/properties?name=emotions",
        {
          credentials: "include",
          headers: {
            authentication: getSkypeToken(),
          },
          body: JSON.stringify(bodyObj),
          method: "PUT",
          mode: "cors",
        }
      )
        .then(log)
        .catch(log);

    });
  });
  createEffect(() => {
    log("emojiOverlayEl exists waiting for it to dissapear", emojiOverlayEl());
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

function waitForElm(selector: string) {
  return new Promise<Element>((resolve) => {
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
      subtree: true,
    });
  });
}
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
