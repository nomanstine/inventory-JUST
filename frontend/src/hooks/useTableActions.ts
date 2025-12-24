import { useRouter } from "next/navigation"

export function useTableActions(basePath: string) {
  const router = useRouter()

  const handleView = (row: any) => {
    router.push(`${basePath}/${row.id}`)
  }

  const handleEdit = (row: any) => {
    router.push(`${basePath}/${row.id}/edit`)
  }

  return { handleView, handleEdit }
}