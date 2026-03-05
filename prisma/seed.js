const { PrismaClient } = require("@prisma/client");

const prismaClient = new PrismaClient();

async function ensureUserWithProfile(inputData) {
  const userItem = await prismaClient.user.upsert({
    where: {
      email: inputData.email,
    },
    update: {
      username: inputData.username,
      provider: "seed",
    },
    create: {
      email: inputData.email,
      username: inputData.username,
      provider: "seed",
    },
  });

  await prismaClient.profile.upsert({
    where: {
      userId: userItem.id,
    },
    update: {
      name: inputData.name,
      bio: inputData.bio,
      avatarUrl: inputData.avatarUrl,
      isPrivate: inputData.isPrivate,
    },
    create: {
      userId: userItem.id,
      name: inputData.name,
      bio: inputData.bio,
      avatarUrl: inputData.avatarUrl,
      isPrivate: inputData.isPrivate,
    },
  });

  return userItem;
}

async function ensurePostWithMedia(userId, captionText, mediaUrl, mediaType, visibilityType) {
  const existingPost = await prismaClient.post.findFirst({
    where: {
      userId,
      caption: captionText,
    },
    select: {
      id: true,
    },
  });

  if (existingPost) {
    return existingPost.id;
  }

  const createdPost = await prismaClient.post.create({
    data: {
      userId,
      caption: captionText,
      visibility: visibilityType,
      media: {
        create: [
          {
            type: mediaType,
            url: mediaUrl,
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });

  return createdPost.id;
}

async function ensureComment(postId, userId, contentText, parentCommentId = null) {
  const existingComment = await prismaClient.comment.findFirst({
    where: {
      postId,
      userId,
      content: contentText,
      parentCommentId,
    },
    select: {
      id: true,
    },
  });

  if (existingComment) {
    return existingComment.id;
  }

  const createdComment = await prismaClient.comment.create({
    data: {
      postId,
      userId,
      content: contentText,
      parentCommentId,
    },
    select: {
      id: true,
    },
  });

  return createdComment.id;
}

async function ensurePostLike(postId, userId) {
  await prismaClient.postLike.upsert({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
    update: {},
    create: {
      userId,
      postId,
    },
  });
}

async function ensureCommentLike(commentId, userId) {
  await prismaClient.commentLike.upsert({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
    update: {},
    create: {
      userId,
      commentId,
    },
  });
}

async function ensureMentionNotification(inputData) {
  const existingMention = await prismaClient.mentionNotification.findFirst({
    where: {
      mentionedUserId: inputData.mentionedUserId,
      actorUserId: inputData.actorUserId,
      sourceType: inputData.sourceType,
      postId: inputData.postId ?? null,
      commentId: inputData.commentId ?? null,
    },
    select: {
      id: true,
    },
  });

  if (existingMention) {
    return;
  }

  await prismaClient.mentionNotification.create({
    data: {
      mentionedUserId: inputData.mentionedUserId,
      actorUserId: inputData.actorUserId,
      sourceType: inputData.sourceType,
      postId: inputData.postId,
      commentId: inputData.commentId,
    },
  });
}

async function ensureFriendRequest(fromUserId, toUserId) {
  await prismaClient.friendRequest.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId,
        toUserId,
      },
    },
    update: {
      status: "pending",
    },
    create: {
      fromUserId,
      toUserId,
      status: "pending",
    },
  });
}

async function ensureTestimonial(fromUserId, toUserId, contentText) {
  const existingTestimonial = await prismaClient.testimonial.findFirst({
    where: {
      fromUserId,
      toUserId,
      content: contentText,
    },
    select: {
      id: true,
    },
  });

  if (existingTestimonial) {
    return;
  }

  await prismaClient.testimonial.create({
    data: {
      fromUserId,
      toUserId,
      content: contentText,
      status: "pending",
    },
  });
}

async function ensureAlbum(userId, albumName) {
  const existingAlbum = await prismaClient.album.findFirst({
    where: {
      userId,
      name: albumName,
    },
    select: {
      id: true,
    },
  });

  if (existingAlbum) {
    return existingAlbum.id;
  }

  const createdAlbum = await prismaClient.album.create({
    data: {
      userId,
      name: albumName,
    },
    select: {
      id: true,
    },
  });

  return createdAlbum.id;
}

async function ensureAlbumItem(albumId, mediaUrl, mediaType, captionText = null) {
  const existingItem = await prismaClient.albumItem.findFirst({
    where: {
      albumId,
      mediaUrl,
    },
    select: {
      id: true,
    },
  });

  if (existingItem) {
    return;
  }

  await prismaClient.albumItem.create({
    data: {
      albumId,
      mediaUrl,
      mediaType,
      caption: captionText,
    },
  });
}

async function runSeed() {
  const leoUser = await ensureUserWithProfile({
    email: "leo.seed@lesssocial.dev",
    username: "eusouleo",
    name: "Leo",
    bio: "Conta seed para testes reais no lessSocial.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    isPrivate: false,
  });

  const mariaUser = await ensureUserWithProfile({
    email: "maria.seed@lesssocial.dev",
    username: "mariaDev",
    name: "Maria Dev",
    bio: "Backend, testes e arquitetura.",
    avatarUrl:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=800&auto=format&fit=crop",
    isPrivate: false,
  });

  const joaoUser = await ensureUserWithProfile({
    email: "joao.seed@lesssocial.dev",
    username: "joaoTech",
    name: "Joao Tech",
    bio: "Frontend e performance.",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop",
    isPrivate: false,
  });

  const carolUser = await ensureUserWithProfile({
    email: "carol.seed@lesssocial.dev",
    username: "carolSys",
    name: "Carol Systems",
    bio: "Arquitetura e produto.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop",
    isPrivate: true,
  });

  const leoPostId = await ensurePostWithMedia(
    leoUser.id,
    "Primeiro post real no banco #lesssocial com @mariaDev",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
    "image",
    "public",
  );

  const mariaPostId = await ensurePostWithMedia(
    mariaUser.id,
    "Atualizando API e melhorias no feed #backend",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    "image",
    "public",
  );

  const joaoPostId = await ensurePostWithMedia(
    joaoUser.id,
    "Trabalhando em UX de postagem #frontend com @eusouleo",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    "image",
    "public",
  );

  await ensurePostWithMedia(
    carolUser.id,
    "Conteudo de perfil privado para teste",
    "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=1200&auto=format&fit=crop",
    "image",
    "public",
  );

  await prismaClient.friendship.upsert({
    where: {
      userAId_userBId: {
        userAId: leoUser.id,
        userBId: carolUser.id,
      },
    },
    update: {},
    create: {
      userAId: leoUser.id,
      userBId: carolUser.id,
    },
  });

  const leoCommentByMariaId = await ensureComment(
    leoPostId,
    mariaUser.id,
    "Excelente resultado, curti demais esse post.",
  );

  const leoCommentByJoaoId = await ensureComment(
    leoPostId,
    joaoUser.id,
    "Top demais, ficou muito bom mesmo.",
  );

  await ensureComment(
    leoPostId,
    leoUser.id,
    "Valeu galera, vamos evoluir mais.",
    leoCommentByMariaId,
  );

  await ensureComment(
    mariaPostId,
    leoUser.id,
    "Parabens pelo avancao da API.",
  );

  await ensureComment(
    joaoPostId,
    mariaUser.id,
    "Layout ficou muito bom.",
  );

  await ensurePostLike(leoPostId, mariaUser.id);
  await ensurePostLike(leoPostId, joaoUser.id);
  await ensurePostLike(mariaPostId, leoUser.id);
  await ensurePostLike(joaoPostId, leoUser.id);

  await ensureCommentLike(leoCommentByMariaId, leoUser.id);
  await ensureCommentLike(leoCommentByJoaoId, mariaUser.id);

  await ensureMentionNotification({
    mentionedUserId: mariaUser.id,
    actorUserId: leoUser.id,
    sourceType: "postCaption",
    postId: leoPostId,
  });

  await ensureMentionNotification({
    mentionedUserId: leoUser.id,
    actorUserId: joaoUser.id,
    sourceType: "postCaption",
    postId: joaoPostId,
  });

  await ensureMentionNotification({
    mentionedUserId: leoUser.id,
    actorUserId: mariaUser.id,
    sourceType: "commentContent",
    postId: leoPostId,
    commentId: leoCommentByMariaId,
  });

  await ensureFriendRequest(joaoUser.id, leoUser.id);

  await ensureTestimonial(
    mariaUser.id,
    leoUser.id,
    "Otima colaboracao tecnica, sempre entrega com qualidade.",
  );

  await prismaClient.profileVisit.upsert({
    where: {
      visitorId_visitedUserId: {
        visitorId: mariaUser.id,
        visitedUserId: leoUser.id,
      },
    },
    update: {
      visitedAt: new Date(),
    },
    create: {
      visitorId: mariaUser.id,
      visitedUserId: leoUser.id,
      visitedAt: new Date(),
    },
  });

  await prismaClient.profileVisit.upsert({
    where: {
      visitorId_visitedUserId: {
        visitorId: joaoUser.id,
        visitedUserId: leoUser.id,
      },
    },
    update: {
      visitedAt: new Date(),
    },
    create: {
      visitorId: joaoUser.id,
      visitedUserId: leoUser.id,
      visitedAt: new Date(),
    },
  });

  const leoAlbumId = await ensureAlbum(leoUser.id, "Album Principal");
  await ensureAlbumItem(
    leoAlbumId,
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
    "image",
    "Imagem de destaque do perfil",
  );
  await ensureAlbumItem(
    leoAlbumId,
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
    "image",
    "Setup de desenvolvimento",
  );

  const mariaAlbumId = await ensureAlbum(mariaUser.id, "Momentos Dev");
  await ensureAlbumItem(
    mariaAlbumId,
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
    "image",
    "Sprint de backend",
  );

  const joaoAlbumId = await ensureAlbum(joaoUser.id, "Design E Produto");
  await ensureAlbumItem(
    joaoAlbumId,
    "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?q=80&w=1200&auto=format&fit=crop",
    "image",
    "Prototipo de interface",
  );
}

runSeed()
  .then(async () => {
    await prismaClient.$disconnect();
    process.stdout.write("Seed concluido com sucesso.\n");
  })
  .catch(async (error) => {
    process.stderr.write(`Seed falhou: ${error.message}\n`);
    await prismaClient.$disconnect();
    process.exit(1);
  });
