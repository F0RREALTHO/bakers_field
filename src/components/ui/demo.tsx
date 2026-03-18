import { StarRating } from "@/components/ui/star-rating";

function DefaultRating() {
  return (
    <div className="space-y-2 text-center">
      <StarRating
        defaultValue={3}
        onRate={(rating) => console.log(`Rated: ${rating}`)}
      />
    </div>
  );
}

function SmallRating() {
  return (
    <div className="space-y-2 text-center">
      <h3 className="font-medium">Small Rating</h3>
      <StarRating
        size="sm"
        onRate={(rating) => console.log(`Rated: ${rating}`)}
      />
    </div>
  );
}

function LargeRating() {
  return (
    <div className="space-y-2 text-center">
      <h3 className="font-medium">Large Rating</h3>
      <StarRating
        size="lg"
        totalStars={10}
        onRate={(rating) => console.log(`Rated: ${rating}`)}
      />
    </div>
  );
}

function DisabledRating() {
  return (
    <div className="space-y-2 text-center">
      <h3 className="font-medium">Disabled Rating</h3>
      <StarRating
        defaultValue={4}
        disabled
      />
    </div>
  );
}

export { DefaultRating, SmallRating, LargeRating, DisabledRating };
