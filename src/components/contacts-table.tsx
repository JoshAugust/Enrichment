"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

interface Contact {
  id: string;
  lead_id: string;
  name?: string | null;
  title?: string | null;
  email?: string | null;
  email_confidence?: number | null;
  phone?: string | null;
  linkedin_url?: string | null;
  verified?: boolean | null;
}

interface ContactsTableProps {
  leadId: string;
}

function EmailConfidenceBadge({ confidence }: { confidence?: number | null }) {
  if (confidence === null || confidence === undefined) return null;
  let className = "bg-red-500/20 text-red-300 border-red-500/30";
  let label = "Low";
  if (confidence >= 0.7) {
    className = "bg-green-500/20 text-green-300 border-green-500/30";
    label = "High";
  } else if (confidence >= 0.3) {
    className = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    label = "Mid";
  }
  return (
    <Badge className={`text-xs border ml-1 ${className}`}>
      {label} {Math.round(confidence * 100)}%
    </Badge>
  );
}

const EMPTY_CONTACT: Partial<Contact> = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin_url: "",
};

export function ContactsTable({ leadId }: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Partial<Contact>>(EMPTY_CONTACT);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?lead_id=${leadId}`, {
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      });
      if (res.status === 404 || res.status === 405) {
        setApiUnavailable(true);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : data.contacts ?? []);
    } catch {
      setApiUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openAddDialog = () => {
    setEditContact({ ...EMPTY_CONTACT, lead_id: leadId });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (contact: Contact) => {
    setEditContact({ ...contact });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = isEditing ? `/api/contacts/${editContact.id}` : "/api/contacts";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        },
        body: JSON.stringify({ ...editContact, lead_id: leadId }),
      });
      if (!res.ok) throw new Error("Save failed");
      setDialogOpen(false);
      fetchContacts();
    } catch {
      // Show graceful error
      setApiUnavailable(false); // reset if it was set
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    setDeletingId(contactId);
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      });
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleEnrich = async (contactId: string) => {
    setEnrichingId(contactId);
    try {
      await fetch(`/api/enrichment/contact/${contactId}`, {
        method: "POST",
        headers: { "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "" },
      });
      fetchContacts();
    } catch {
      // ignore
    } finally {
      setEnrichingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (apiUnavailable) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-1" />
            Add Contact
          </Button>
        </div>
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <UserRound className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Contacts API not available yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            The contacts API is being built. Check back soon.
          </p>
        </div>
        <ContactDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contact={editContact}
          setContact={setEditContact}
          isEditing={isEditing}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-1" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <UserRound className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No contacts yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add one or run enrichment to discover contacts.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Title</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">LinkedIn</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">✓</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium">{contact.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">
                      {contact.title ?? "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="text-sm">{contact.email ?? "—"}</span>
                        <EmailConfidenceBadge confidence={contact.email_confidence} />
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">
                      {contact.phone ?? "—"}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {contact.linkedin_url ? (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {contact.verified ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(contact)}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEnrich(contact.id)}
                          disabled={enrichingId === contact.id}
                          title="Enrich"
                        >
                          {enrichingId === contact.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(contact.id)}
                          disabled={deletingId === contact.id}
                          title="Delete"
                        >
                          {deletingId === contact.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editContact}
        setContact={setEditContact}
        isEditing={isEditing}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Partial<Contact>;
  setContact: (c: Partial<Contact>) => void;
  isEditing: boolean;
  saving: boolean;
  onSave: () => void;
}

function ContactDialog({
  open,
  onOpenChange,
  contact,
  setContact,
  isEditing,
  saving,
  onSave,
}: ContactDialogProps) {
  const set = (field: keyof Contact, value: string) => {
    setContact({ ...contact, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Name</Label>
            <Input
              value={contact.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1"
              placeholder="John Smith"
            />
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={contact.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1"
              placeholder="CEO"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={contact.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              className="mt-1"
              type="email"
              placeholder="john@company.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={contact.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              className="mt-1"
              type="tel"
            />
          </div>
          <div>
            <Label>LinkedIn URL</Label>
            <Input
              value={contact.linkedin_url ?? ""}
              onChange={(e) => set("linkedin_url", e.target.value)}
              className="mt-1"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isEditing ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
