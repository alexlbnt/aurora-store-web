import { notFound } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CustomerForm from "../new/CustomerForm";
import { prisma } from "@/lib/prisma";

export default async function EditCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  console.log("EditCustomerPage params customerId:", customerId);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  });
  console.log("Customer found:", customer);

  if (!customer) {
    notFound();
  }

  return (
    <AdminLayout>
      <CustomerForm initialData={customer} />
    </AdminLayout>
  );
}
