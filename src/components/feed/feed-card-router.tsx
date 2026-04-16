import {
  SparingFeedCard,
  EventFeedCard,
  TransferFeedCard,
  TournamentFeedCard,
  ClubPostFeedCard,
  NewMemberFeedCard,
} from "@/components/feed";

export type FeedItem = {
  type: "sparing" | "event" | "transfer" | "club" | "player" | "tournament" | "clubPost";
  data: any;
  createdAt: string | Date;
};

export function FeedCard({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "sparing":
      return <SparingFeedCard data={item.data} createdAt={item.createdAt} />;
    case "event":
      return <EventFeedCard data={item.data} createdAt={item.createdAt} />;
    case "transfer":
      return <TransferFeedCard data={item.data} createdAt={item.createdAt} />;
    case "tournament":
      return <TournamentFeedCard data={item.data} createdAt={item.createdAt} />;
    case "clubPost":
      return <ClubPostFeedCard data={item.data} createdAt={item.createdAt} />;
    case "club":
    case "player":
      return <NewMemberFeedCard type={item.type} data={item.data} createdAt={item.createdAt} />;
  }
}
