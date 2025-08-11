import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import ContactModal from "@/components/modals/contact-modal";
import type { Contact } from "@shared/schema";

export default function Contacts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [deleteContact, setDeleteContact] = useState<Contact | undefined>();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: api.contacts.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.contacts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Sucesso",
        description: "Contato removido com sucesso!",
      });
      setDeleteContact(undefined);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover contato. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const testMessageMutation = useMutation({
    mutationFn: (data: { phoneNumber: string; message: string }) => 
      api.whatsapp.sendTest(data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Mensagem de teste enviada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem de teste.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedContact(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(undefined);
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeleteContact(contact);
  };

  const handleDeleteConfirm = () => {
    if (deleteContact) {
      deleteMutation.mutate(deleteContact.id);
    }
  };

  const handleTestMessage = (contact: Contact) => {
    const testMessage = `🧪 Mensagem de teste do Sistema de Aniversários\n\nOlá ${contact.name}!\n\nEste é um teste para verificar se as notificações estão funcionando corretamente.\n\nSistema funcionando! ✅`;
    
    testMessageMutation.mutate({
      phoneNumber: contact.phone,
      message: testMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Contatos da Gerência
          </h3>
          <p className="text-sm text-gray-500">
            Gerencie os números que receberão as notificações de aniversário
          </p>
        </div>
        <Button onClick={handleAdd}>
          <i className="fas fa-plus mr-2"></i>
          Adicionar Contato
        </Button>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200">
            {contacts?.map((contact) => (
              <div key={contact.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      contact.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <i className={`fas fa-whatsapp text-lg ${
                        contact.isActive ? 'text-green-600' : 'text-gray-400'
                      }`}></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {contact.name}
                      </h4>
                      <p className="text-sm text-gray-500">{contact.role}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contact.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-1 ${
                          contact.isActive ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      ></div>
                      {contact.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    
                    {contact.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestMessage(contact)}
                        disabled={testMessageMutation.isPending}
                      >
                        {testMessageMutation.isPending ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-paper-plane"></i>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(contact)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {contacts?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-phone text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum contato cadastrado
                </h3>
                <p className="text-sm">
                  Adicione contatos da gerência para receber as notificações de aniversário
                </p>
                <Button onClick={handleAdd} className="mt-4">
                  <i className="fas fa-plus mr-2"></i>
                  Adicionar Primeiro Contato
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        contact={selectedContact}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteContact?.name}</strong>? 
              Este contato não receberá mais notificações de aniversário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
