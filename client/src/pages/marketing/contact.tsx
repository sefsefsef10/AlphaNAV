import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    interest: "",
    message: ""
  });

  const submitLead = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your interest!",
        description: "We'll be in touch within 24 hours to schedule your demo.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        phone: "",
        interest: "",
        message: ""
      });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again or email us directly at contact@alphanav.com",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitLead.mutate(formData);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AN</span>
              </div>
              <span className="font-semibold text-lg">AlphaNAV</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/marketing/solutions" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-solutions">
              Solutions
            </Link>
            <Link href="/marketing/pricing" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-pricing">
              Pricing
            </Link>
            <Link href="/marketing/security" className="text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md" data-testid="link-security">
              Security
            </Link>
            <Link href="/marketing/contact" className="text-sm font-medium hover-elevate px-3 py-2 rounded-md" data-testid="link-contact">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/api/login">
              <Button variant="ghost" size="sm" data-testid="button-login-nav">
                Sign In
              </Button>
            </Link>
            <Link href="/marketing/contact">
              <Button size="sm" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" data-testid="heading-contact">
                Get Started with AlphaNAV
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Schedule a personalized demo to see how AlphaNAV can transform your NAV lending operations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Request a Demo</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll be in touch within 24 hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                            data-testid="input-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            data-testid="input-last-name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Work Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          data-testid="input-email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          required
                          data-testid="input-company"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          data-testid="input-phone"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="interest">I'm interested in *</Label>
                        <Select
                          value={formData.interest}
                          onValueChange={(value) => setFormData({ ...formData, interest: value })}
                          required
                        >
                          <SelectTrigger id="interest" data-testid="select-interest">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Scheduling a demo</SelectItem>
                            <SelectItem value="pricing">Pricing information</SelectItem>
                            <SelectItem value="enterprise">Enterprise solutions</SelectItem>
                            <SelectItem value="security">Security & compliance</SelectItem>
                            <SelectItem value="other">Other inquiry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={4}
                          placeholder="Tell us about your NAV lending operations..."
                          data-testid="textarea-message"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitLead.isPending}
                        data-testid="button-submit"
                      >
                        {submitLead.isPending ? "Submitting..." : "Request Demo"}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By submitting this form, you agree to our Privacy Policy and Terms of Service
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">Email</div>
                        <a href="mailto:contact@alphanav.com" className="text-sm text-muted-foreground hover-elevate inline-block">
                          contact@alphanav.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">Phone</div>
                        <a href="tel:+15551234567" className="text-sm text-muted-foreground hover-elevate inline-block">
                          +1 (555) 123-4567
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">Office</div>
                        <p className="text-sm text-muted-foreground">
                          San Francisco, CA<br />
                          United States
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/30">
                  <CardHeader>
                    <CardTitle>What to Expect</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>Response within 24 hours</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>30-minute personalized demo</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>Custom pricing discussion</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>14-day free trial access</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
