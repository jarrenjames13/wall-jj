import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PostInput() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <Input 
          placeholder="What's on your mind?" 
          className="w-full"
        />
        <Button className="w-full">Share</Button>
      </div>
    </Card>
  );
}