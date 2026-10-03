import { Prisma } from '@prisma/client';

export function handleDatabaseError(error: any, defaultMessage: string = "Ocorreu um erro inesperado. Tente novamente."): string {
  console.error("Action Error Details:", error);

  // Prisma Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError || (error && error.code && error.meta)) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target as string | string[] | undefined;
        let fields = "";
        
        if (Array.isArray(target)) {
          fields = target.join(', ');
        } else if (typeof target === 'string') {
          fields = target;
        }

        if (fields.includes('sku') || fields.includes('SKU')) {
          return "O Código de Referência deste produto já está sendo usado por outro item no sistema. Não pode haver dois produtos com o mesmo nome. Por favor, informe um nome diferente!";
        }
        if (fields.includes('slug') || fields.includes('name')) {
          return "Já existe um registro com este nome no sistema. Por favor, tente um nome diferente.";
        }
        if (fields.includes('email')) {
          return "Este endereço de e-mail já está em uso por outro cliente.";
        }
        
        return "Não foi possível salvar pois já existe um registro idêntico no sistema (dado duplicado).";
      }
      case 'P2003':
        return "Não foi possível realizar esta ação porque a informação está vinculada a outros dados no sistema.";
      case 'P2025':
        return "A informação que você tentou acessar ou atualizar não foi encontrada (pode ter sido excluída).";
      default:
        return `Ocorreu uma falha no banco de dados. Por favor, tente novamente ou contate o suporte.`;
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError || (error && error.message && error.message.includes('ValidationError'))) {
    return "Os dados preenchidos estão incorretos ou em formato inválido. Verifique os campos e tente novamente.";
  }

  // Fallback for general errors
  if (error instanceof Error) {
    if (error.message.includes('prisma') || error.message.includes('Invalid `prisma')) {
       return "Ocorreu uma falha na comunicação com o banco de dados. Tente novamente em instantes.";
    }
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
