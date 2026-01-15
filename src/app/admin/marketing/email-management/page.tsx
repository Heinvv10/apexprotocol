"use client";

export default function EmailManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Lists</h1>
        <p className="text-muted-foreground mt-1">Manage email lists and subscribers</p>
      </div>
      <div className="card-secondary flex items-center justify-center py-12">
        <p className="text-muted-foreground">No email lists yet</p>
      </div>
    </div>
  );
}
