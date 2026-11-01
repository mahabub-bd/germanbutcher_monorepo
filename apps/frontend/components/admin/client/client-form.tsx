"use client"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formPostData, patchData, postData } from "@/utils/api-utils"

import { revalidatePublic } from "@/actions/revalidate"
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
        const result = await formPostData<{ id: number }>("attachment", formData)
        imageId = result.data!.id
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
        await revalidatePublic()
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 w-full">
        {/* Client details */}
        <FormSection
          title="Client details"
          description="Name and ordering used across the admin and storefront."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Client name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Foods" {...field} className="w-full flex-1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 (lower shows first)"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full flex-1 tabular-nums"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Logo & visibility */}
        <FormSection
          title="Logo & visibility"
          description="The logo shown beside the client and whether it is live."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Client logo</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-muted/20">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Client logo preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("client-upload")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose image
                        </Button>
                        <p className="break-all text-xs text-muted-foreground">
                          {fileName || "PNG or JPG recommended"}
                        </p>
                      </div>
                      <Input
                        id="client-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col justify-center">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <SwitchRow
                    label="Active"
                    hint="Client is visible on the storefront"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-2 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end">
          <p className="mr-auto hidden text-xs text-muted-foreground lg:block">
            The client appears on the storefront immediately after saving.
          </p>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create client" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

/** A bordered card that groups related fields under a titled header, so the
 *  form reads as distinct sections instead of one long grid. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="border-b px-3.5 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  )
}

/** Toggle rendered as a full-width row: label + hint on the left, switch on
 *  the right. Clicking anywhere on the row flips the switch. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(event) => event.stopPropagation()}
        className="shrink-0"
      />
    </div>
  )
}
