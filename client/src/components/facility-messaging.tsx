import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, User, Building2 } from "lucide-react";
import { insertMessageSchema } from "@shared/schema";
import type { Message } from "@shared/schema";

interface FacilityMessagingProps {
  facilityId: string;
  gpUserId: string;
}

export function FacilityMessaging({ facilityId, gpUserId }: FacilityMessagingProps) {
  const { toast } = useToast();
  const [threadId] = useState(`facility-${facilityId}`);

  // Query for messages in this thread
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages?threadId=${threadId}`],
  });

  const messageFormSchema = insertMessageSchema.extend({
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(5, "Message must be at least 5 characters"),
  });

  type MessageFormData = z.infer<typeof messageFormSchema>;

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      threadId,
      senderId: gpUserId,
      senderRole: "gp",
      recipientId: "operations-team",
      recipientRole: "operations",
      subject: "",
      body: "",
      relatedEntityType: "facility",
      relatedEntityId: facilityId,
      isRead: false,
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormData) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages?threadId=${threadId}`] 
      });
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the NAV IQ team",
      });
      form.reset({
        threadId,
        senderId: gpUserId,
        senderRole: "gp",
        recipientId: "operations-team",
        recipientRole: "operations",
        subject: "",
        body: "",
        relatedEntityType: "facility",
        relatedEntityId: facilityId,
        isRead: false,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Send Message",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    sendMessageMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Messages with NAV IQ Team</h3>
        <p className="text-sm text-muted-foreground">
          Communicate directly with your relationship manager
        </p>
      </div>

      {/* Message Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
          <CardDescription>
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold">No Messages Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Start a conversation with your NAV IQ relationship manager
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <Card
                    key={message.id}
                    className={
                      message.senderRole === "gp"
                        ? "ml-8 bg-primary/5"
                        : "mr-8 bg-muted"
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {message.senderRole === "gp" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                          <span className="font-semibold text-sm">
                            {message.senderRole === "gp"
                              ? "You"
                              : "NAV IQ Team"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {message.subject && (
                        <CardTitle className="text-sm font-medium">
                          {message.subject}
                        </CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* New Message Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send New Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Message subject..."
                        data-testid="input-message-subject"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message..."
                        className="resize-none"
                        rows={4}
                        data-testid="input-message-body"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={sendMessageMutation.isPending}
                data-testid="button-send-message"
                className="w-full"
              >
                {sendMessageMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
