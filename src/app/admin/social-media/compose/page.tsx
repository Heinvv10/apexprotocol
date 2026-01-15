"use client";

import { PostComposer } from "@/components/admin/post-composer";
import { useRouter } from "next/navigation";

export default function ComposePage() {
  const router = useRouter();

  const handleSave = (draft: any) => {
    console.log("Draft saved:", draft);
    // TODO: Save draft to database
    alert("Draft saved successfully!");
  };

  const handlePublish = (post: any) => {
    console.log("Post published:", post);
    // TODO: Publish post via API
    if (post.status === "scheduled") {
      alert(`Post scheduled for ${post.scheduledDate} at ${post.scheduledTime}!`);
    } else {
      alert("Post published successfully!");
    }
    router.push("/admin/social-media/channels");
  };

  return (
    <div className="space-y-6">
      <PostComposer onSave={handleSave} onPublish={handlePublish} />
    </div>
  );
}
