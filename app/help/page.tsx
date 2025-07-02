"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"

interface FAQItem {
  question: string
  answer: string
  category: string
}

interface ArticleItem {
  id: string
  title: string
  category: string
  date: string
}

const faqData: FAQItem[] = [
  {
    question: "How do I reset my password?",
    answer:
      "You can reset your password by clicking on the 'Forgot Password' link on the login page and following the instructions.",
    category: "Account",
  },
  {
    question: "Where can I find my invoices?",
    answer: "Invoices are available in the 'Billing' section of your account settings.",
    category: "Billing",
  },
  {
    question: "How do I create a new proposal?",
    answer: "Navigate to the 'Proposals' section from the sidebar and click on the 'Create New Proposal' button.",
    category: "Proposals",
  },
  {
    question: "What types of inventory can I track?",
    answer:
      "You can track various types of outdoor advertising inventory, including LED billboards, static billboards, digital kiosks, and more.",
    category: "Inventory",
  },
  {
    question: "Is there an API available for integration?",
    answer:
      "Yes, we offer a comprehensive API for seamless integration with your existing systems. Please refer to our API documentation for details.",
    category: "Technical",
  },
]

const articleData: ArticleItem[] = [
  { id: "1", title: "Getting Started with Jiven: A Quick Guide", category: "Getting Started", date: "2024-06-01" },
  { id: "2", title: "Understanding Your Sales Dashboard", category: "Sales", date: "2024-05-20" },
  { id: "3", title: "Optimizing Your Inventory Management", category: "Inventory", date: "2024-05-15" },
  { id: "4", title: "Advanced Features for Proposal Generation", category: "Proposals", date: "2024-06-10" },
  { id: "5", title: "Troubleshooting Common Login Issues", category: "Account", date: "2024-04-25" },
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")

  const filteredFaqs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "All" || faq.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const filteredArticles = articleData.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "All" || article.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["All", ...new Set([...faqData.map((f) => f.category), ...articleData.map((a) => a.category)])]

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Help & Support</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search help articles or FAQs..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Category: {filterCategory} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {categories.map((category) => (
                  <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)}>
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Links / Popular Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Setting up your account
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Navigating the dashboard
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    First steps with proposals
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Billing & Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Understanding your invoice
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Payment methods
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Subscription plans
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Technical Support</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Troubleshooting common issues
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    API documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Contact support
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground">No FAQs found matching your criteria.</p>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Base Articles */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredArticles.length > 0 ? (
              <div className="grid gap-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <Link href="#" className="text-lg font-medium hover:underline">
                      {article.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Category: {article.category} | Published: {article.date}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No articles found matching your criteria.</p>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              If you can't find what you're looking for, our support team is here to assist you.
            </p>
            <Button asChild>
              <Link href="mailto:support@jiven.com">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
