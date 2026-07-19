"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formPostData, patchData, postData } from "@/utils/api-utils"
import type { Client } from "@/utils/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Section } from "../helper"

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  order: z.number().min(0, "Order must be 0 or greater"),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientFormProps {
  mode: "create" | "edit"
  client?: Client
}

export function ClientForm({ mode, client }: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [imagePreview, setImagePreview] = useState(client?.Image?.url || "")
  const router = useRouter()

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      order: client?.order || 0,
      isActive: client?.isActive ?? true,
      imageUrl: client?.Image?.url || "",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileName(selectedFile.name)

    const fileUrl = URL.createObjectURL(selectedFile)
    setImagePreview(fileUrl)

    form.setValue("imageUrl", "")
  }

  const handleSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)

    try {
      let imageId = client?.Image?.id

      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        const result = await formPostData("attachment", formData)
        imageId = result.data.id
      }

      const clientData = {
        ...data,
        Image: imageId,
      }

      const endpoint = mode === "create" ? "clients" : `clients/${client?.Id}`
      const method = mode === "create" ? postData : patchData

      const response = await method(endpoint, clientData)

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage = mode === "create" ? "Client created successfully" : "Client updated successfully"
        toast.success(successMessage)
        router.back()
      } else {
        toast.error(response?.message || "An error occurred")
      }
    } catch (error) {
      console.error("Error submitting client form:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith("http")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 w-full">
        <div className="p-6 space-y-6 w-full mx-auto">
          {/* Basic Information Section */}
          <Section title="Basic Information">
            <div className="w-full grid md:grid-cols-2 grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client name" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter display order"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          {/* Media & Status Section */}
          <div className="grid grid-cols-2 justify-end gap-6 w-full">
            <Section title="Media">
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>Client Logo</FormLabel>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex items-center gap-4 w-full">
                        {imagePreview ? (
                          <div className="relative w-64 h-32 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={imagePreview || "/placeholder.svg"}
                              alt="Client logo preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-32 h-32 border rounded-md bg-muted/20">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => document.getElementById("client-upload")?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground">{fileName || "No file chosen"}</span>
                        </div>
                      </div>
                      <Input
                        id="client-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            <Section title="Status">
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <SwitchCard
                      label="Active Status"
                      description="Client will be visible to users"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end px-6 w-full mx-auto">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "create" ? "Create Client" : "Update Client"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

const SwitchCard = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4 w-full">
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
)
