import {
  createMutation,
  createQuery,
  useQueryClient,
} from "@adeora/solid-query";
import { Accessor } from "solid-js";
import { log } from "./App";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift();
}

export function getSkypeToken() {
  const skypeToken = getCookie("skypetoken_asm");
  return `skypetoken=${skypeToken}`;
}

type UseReactionMutationProps = {
  chatId: string;
  messageId: string;
  key: string;
};

export function useReactionMutation() {
  const queryClient = useQueryClient();

  return createMutation(
    (props: UseReactionMutationProps) => {
      const bodyObj = { emotions: { key: props.key, value: 1662588778832 } };
      return fetch(
        `https://amer.ng.msg.teams.microsoft.com/v1/users/ME/conversations/${props.chatId}/messages/${props.messageId}/properties?name=emotions`, // &replace=true is usually added, but it seems to only replace the original keys
        {
          credentials: "include",
          headers: {
            authentication: getSkypeToken(),
          },
          body: JSON.stringify(bodyObj),
          method: "PUT",
          mode: "cors",
        }
      );
    },
    {
      async onMutate(variables) {
        await queryClient.cancelQueries([
          "reactions",
          variables.chatId,
          variables.messageId,
        ]);
      },
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries([
          "reactions",
          variables.chatId,
          variables.messageId,
        ]);
      },
    }
  );
}

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

export function useReactionsQuery(chatId: Accessor<string>, messageId: string) {
  return createQuery<RespMessage>(
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
            authentication: getSkypeToken(),
          },
        }
      )
        .then((r) => {
          log("[Response]", r);
          return r.json();
        })
        .then((d) => {
          log("[Response data]", d);
          return d;
        })
        .catch((e) => {
          log("[Error]", e);
          throw e;
        });
    },
    { staleTime: 10 * 60 * 1000 }
  );
}
