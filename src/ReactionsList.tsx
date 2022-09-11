import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  onCleanup,
} from "solid-js";
import { useReactionsQuery } from "./api";
import { log } from "./App";

type Props = {
  chatId: Accessor<string>;
  messageEl: Element;
  emojiOverlayEl: Accessor<Element | undefined>;
};

const ReactionsList: Component<Props> = (props) => {
  const [listComponent, setListComponent] = createSignal<Element>();

  createEffect(() => {
    if (props.emojiOverlayEl()?.parentElement === props.messageEl) {
      query.refetch();
    }
  });

  createEffect(() => {
    listComponent()?.parentElement?.removeChild(listComponent()!);
  });

  const messageId = props.messageEl.getAttribute("data-mid")!;

  const query = useReactionsQuery(props.chatId, messageId);

  const headEl = props.messageEl.querySelector(
    '[class="ui-chat__messageheader"]'
  );

  createEffect(() => {
    const listComponent_ = listComponent();
    if (!listComponent_) return;

    log("[ReactionList] listComponent() rendered appending to head");

    headEl?.appendChild(listComponent_);
    onCleanup(() => headEl?.removeChild(listComponent_));
  });

  return (
    <div ref={setListComponent}>
      {JSON.stringify(query.data?.annotationsSummary?.emotions ?? {})}
    </div>
  );
};

export default ReactionsList;
