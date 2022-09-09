import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  For,
  onCleanup,
} from "solid-js";
import { getSkypeToken, log } from "./App";

interface RespMessage {
  id: string;
  clientmessageid: string;
  conversationid: string;
  conversationLink: string;
  type: string;
  from: string;
  fromTenantId: string;
  imdisplayname: string;
  properties: {
    emotions: {
      key: string;
      users: { value: string }[];
    }[];
  };
  annotationsSummary?: {
    emotions: {
      [key: string]: number;
    };
  };
}

function useReactionsQuery(chatId: Accessor<string>, messageId: string) {
  const [refetchCounter, setRefetchCounter] = createSignal(0);
  const [data, setData] = createSignal<RespMessage>();

  createEffect(() => {
    log("[data, chatId, messageId]", chatId(), messageId, data());
  });

  createEffect(() => {
    refetchCounter();

    fetch(
      `https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${chatId()}/messages/${messageId}`,
      {
        headers: {
          authentication: getSkypeToken(),
        },
      }
    )
      .then((r) => r.json())
      .then(setData)
      .catch((e) => log("[ERROR useReactionsQuery]", e));
  });

  return { data, refetch: () => setRefetchCounter((r) => r + 1) };

  // const query = createQuery<RespMessage>(
  //   () => ["reactions", chatId, messageId],
  //   () => {
  //     return fetch(
  //       `https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${chatId}/messages/${messageId}`,
  //       {
  //         headers: {
  //           authentication: getSkypeToken(),
  //         },
  //       }
  //     ).then((r) => r.json());
  //   }
  // );

  // return query;
}

type Props = {
  chatId: Accessor<string>;
  messageEl: Element;
  emojiOverlayEl: Accessor<Element | undefined>;
};

const ReactionsList: Component<Props> = (props) => {
  const [listComponent, setListComponent] = createSignal<Element>();

  createEffect(() => {
    if (props.emojiOverlayEl()?.parentElement === props.messageEl) {
      refetch();
    }
  });

  createEffect(() => {
    log(
      "[Render ReactionList] removing parent for list ocmponent",
      listComponent()
    );
    listComponent()?.parentElement?.removeChild(listComponent()!);
  });

  log("[Render ReactionList]", props);

  const messageId = props.messageEl.getAttribute("data-mid")!;
  log("got messageId", messageId);

  const { data, refetch } = useReactionsQuery(props.chatId, messageId);
  log("data accessor", data);

  const headEl = props.messageEl.querySelector(
    '[class="ui-chat__messageheader"]'
  );
  log("head el", headEl);

  createEffect(() => {
    log("effect for listComponent appending", listComponent());
    const listComponent_ = listComponent();
    if (!listComponent_) return;

    log("[ReactionList] listComponent() rendered appending to head");

    headEl?.appendChild(listComponent_);
    onCleanup(() => headEl?.removeChild(listComponent_));
  });

  return (
    <div ref={setListComponent}>
      {JSON.stringify(data()?.annotationsSummary?.emotions ?? {})}
    </div>
  );
};

export default ReactionsList;
