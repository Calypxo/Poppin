import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { Select, Input, Textarea } from "../../components/ui/FormControls";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api/client";
import useResource, { errorMessage } from "../../hooks/useResource";
import {
  announcementSchema,
  type AnnouncementFormData,
} from "../../schemas/announcementSchema";
import type { Announcement } from "../../types/announcement";
import type { Event } from "../../types/event";
import FormField from "../../components/forms/FormField";
import ImageUploader from "../../components/forms/ImageUploader";
import ResourceState from "../../components/shared/ResourceState";
import EventPostCard from "../../components/shared/EventPostCard";
import { PageHeader } from "../../components/layout/Page";
import { useUI } from "../../components/ui/context";
import { EmptyState } from "../../components/ui/States";
import { ButtonLink } from "../../components/ui/Button";
import { Megaphone, FileText, Radio } from "lucide-react";
export default function OrganizerAnnouncementsPage() {
  const { confirm, toast } = useUI();
  const { eventId } = useParams();
  const [params, setParams] = useSearchParams();
  const events = useResource<Event[]>("/events/mine");
  const resource = useResource<Announcement[]>("/posts/mine");
  const editingId = params.get("edit") || "";
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      event: eventId || "",
      title: "",
      content: "",
      type: "announcement",
      imageUrl: "",
    },
  });
  const image = useWatch({ control, name: "imageUrl" });
  const selectedEvents =
    events.data?.filter((event) => !eventId || event._id === eventId) || [];
  const posts =
    resource.data?.filter((post) => !eventId || post.event._id === eventId) ||
    [];
  const edit = params.get("edit");
  useEffect(() => {
    if (!edit || !resource.data) return;
    const post = resource.data.find(
      (value) =>
        value._id === edit && (!eventId || value.event._id === eventId),
    );
    if (post) {
      reset({
        event: post.event._id,
        title: post.title,
        content: post.content,
        type: post.type,
        imageUrl: post.imageUrl || "",
      });
    }
  }, [edit, resource.data, eventId, reset]);
  async function save(data: AnnouncementFormData, publish: boolean) {
    setError("");
    setMessage("");
    try {
      if (editingId)
        await api.patch(`/posts/${editingId}`, {
          ...data,
          isPublished: publish,
        });
      else await api.post("/posts", { ...data, isPublished: publish });
      setMessage(publish ? "Your update is live." : "Draft saved.");
      toast.success(
        publish
          ? "Your update is live on the local noticeboard."
          : "Update draft saved.",
      );
      setParams({});
      reset({
        event: eventId || "",
        title: "",
        content: "",
        type: "announcement",
        imageUrl: "",
      });
      resource.reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  return (
    <main className="poppin-page poppin-updates-page">
      <Link to={eventId ? `/events/${eventId}` : "/my-events"}>
        ← Your event
      </Link>
      <PageHeader
        eyebrow="KEEP EVERYONE IN THE LOOP"
        title="Event updates"
        description="Opening-day details, a lineup reveal or a change of plan. Share what your community needs to know."
        motif="book-stack"
      />
      <ResourceState {...events} />
      <ResourceState {...resource} />
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      {resource.data && (
        <div className="poppin-account-metrics">
          <div>
            <Megaphone size={22} aria-hidden="true" />
            <span>Total updates</span>
            <strong>{posts.length}</strong>
          </div>
          <div>
            <Radio size={22} aria-hidden="true" />
            <span>Published</span>
            <strong>{posts.filter((post) => post.isPublished).length}</strong>
          </div>
          <div>
            <FileText size={22} aria-hidden="true" />
            <span>Drafts</span>
            <strong>{posts.filter((post) => !post.isPublished).length}</strong>
          </div>
        </div>
      )}
      {selectedEvents.length > 0 && (
        <div className="poppin-management-grid poppin-composer-grid">
          <form
            className="poppin-editor-form"
            noValidate
            onSubmit={handleSubmit((data) => save(data, true))}
          >
            <p className="poppin-eyebrow">01 / THE LATEST FROM YOUR EVENT</p>
            <h2>{editingId ? "Edit update" : "New update"}</h2>
            <FormField
              id="post-event"
              label="Event"
              error={errors.event?.message}
            >
              <Select {...register("event")}>
                <option value="">Choose your event</option>
                {selectedEvents.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title} ({event.status})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="post-title"
              label="Title"
              error={errors.title?.message}
            >
              <Input {...register("title")} maxLength={200} />
            </FormField>
            <FormField
              id="post-content"
              label="Update"
              error={errors.content?.message}
            >
              <Textarea rows={6} {...register("content")} maxLength={10000} />
            </FormField>
            <FormField
              id="post-type"
              label="Post type"
              error={errors.type?.message}
            >
              <Select {...register("type")}>
                {[
                  "announcement",
                  "schedule_update",
                  "vendor_call",
                  "reminder",
                  "lineup",
                  "general",
                  "important",
                ].map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </FormField>
            <ImageUploader
              label="Post image (optional)"
              value={image || ""}
              onChange={(value) => setValue("imageUrl", value)}
              onBusy={setBusy}
            />
            <div className="poppin-actions poppin-form-footer">
              <Button type="submit" disabled={busy || isSubmitting}>
                Publish update
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || isSubmitting}
                onClick={handleSubmit((data) => save(data, false))}
              >
                Save draft
              </Button>
              {editingId && (
                <Button
                  type="button"
                  onClick={() => {
                    setParams({});
                    reset({
                      event: eventId || "",
                      title: "",
                      content: "",
                      type: "announcement",
                      imageUrl: "",
                    });
                  }}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
          <section className="poppin-management-history">
            <div className="poppin-section-heading">
              <h2>
                <span className="poppin-section-index">02</span>Your updates
              </h2>
              <span className="poppin-count">{posts.length}</span>
            </div>
            <ResourceState
              loading={false}
              error=""
              empty={!posts.length ? "No updates for this event yet." : ""}
            />
            <div className="poppin-record-list">
              {posts.map((post) => (
                <div key={post._id}>
                  <EventPostCard
                    post={post}
                    onDelete={async (value) => {
                      if (
                        !(await confirm({
                          title: `Delete “${value.title}”?`,
                          description:
                            "This removes the update from your event and the shared feed.",
                          confirmLabel: "Delete post",
                          cancelLabel: "Keep post",
                        }))
                      )
                        return;
                      try {
                        await api.delete(`/posts/${value._id}`);
                        toast.success("Post deleted.");
                        resource.reload();
                      } catch (err) {
                        setError(errorMessage(err));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {!events.loading && !selectedEvents.length && (
        <EmptyState
          description="Create your own event before sharing updates with your local circle."
          action={<ButtonLink to="/events/new">Create an event</ButtonLink>}
        />
      )}
    </main>
  );
}
