package com.project.app.config;

import com.project.app.notebook.entity.NotebookBook;
import com.project.app.notebook.enums.NotebookBookType;
import com.project.app.notebook.repository.NotebookBookRepository;
import com.project.app.post.entity.Post;
import com.project.app.post.repository.PostRepository;
import com.project.app.support.entity.SupportMessage;
import com.project.app.support.entity.SupportTicket;
import com.project.app.support.enums.SupportSenderType;
import com.project.app.support.enums.SupportTicketStatus;
import com.project.app.support.repository.SupportMessageRepository;
import com.project.app.support.repository.SupportTicketRepository;
import com.project.app.transaction.entity.Transaction;
import com.project.app.transaction.enums.TransactionStatus;
import com.project.app.transaction.enums.TransactionType;
import com.project.app.transaction.repository.TransactionRepository;
import com.project.app.user.entity.Role;
import com.project.app.user.entity.User;
import com.project.app.user.repository.UserRepository;
import com.project.app.wallet.entity.Wallet;
import com.project.app.wallet.enums.WalletType;
import com.project.app.wallet.repository.WalletRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Seed dữ liệu mẫu phục vụ Web Admin (users, ví, giao dịch, banner).
 * Idempotent: chỉ tạo khi chưa có user demo.
 */
@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final WalletRepository walletRepository;
    private final NotebookBookRepository notebookBookRepository;
    private final TransactionRepository transactionRepository;
    private final PostRepository postRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final SupportMessageRepository supportMessageRepository;

    public DatabaseSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate,
            WalletRepository walletRepository,
            NotebookBookRepository notebookBookRepository,
            TransactionRepository transactionRepository,
            PostRepository postRepository,
            SupportTicketRepository supportTicketRepository,
            SupportMessageRepository supportMessageRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.walletRepository = walletRepository;
        this.notebookBookRepository = notebookBookRepository;
        this.transactionRepository = transactionRepository;
        this.postRepository = postRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.supportMessageRepository = supportMessageRepository;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50)");
        } catch (Exception ignored) {
        }

        seedAdmin();
        seedPosts();
    }

    private void seedAdmin() {
        if (userRepository.existsByUsername("admin")) {
            return;
        }
        User admin = new User(
                "admin",
                "admin@smartspend.com",
                passwordEncoder.encode("admin123"),
                Role.ADMIN,
                true
        );
        userRepository.save(admin);
        System.out.println("[SEED] ADMIN: admin@smartspend.com / admin123");
    }

    private void seedDemoUsersAndFinance() {
        if (userRepository.existsByUsername("nguyenvana")) {
            return;
        }

        String rawPassword = "User@123";
        String encodedPassword = passwordEncoder.encode(rawPassword);
        String encodedPin = passwordEncoder.encode("123456");

        User u1 = createUser("nguyenvana", "nguyenvana@gmail.com", encodedPassword, true);
        User u2 = createUser("tranthib", "tranthib@gmail.com", encodedPassword, true);
        User u3 = createUser("leminhc", "leminhc@gmail.com", encodedPassword, false); // bị khóa để demo

        Wallet w1Main = createWallets(u1, "100000000001", new BigDecimal("2500000"));
        Wallet w2Main = createWallets(u2, "100000000002", new BigDecimal("1800000"));
        Wallet w3Main = createWallets(u3, "100000000003", new BigDecimal("500000"));

        u1.setPinCode(encodedPin);
        u2.setPinCode(encodedPin);
        userRepository.saveAll(List.of(u1, u2));

        // Giao dịch mẫu — user 1
        saveTx(u1, w1Main, new BigDecimal("1000000"), TransactionType.TOP_UP, TransactionStatus.SUCCESS, "Nạp tiền VietQR tháng 7");
        saveTx(u1, w1Main, new BigDecimal("500000"), TransactionType.TOP_UP, TransactionStatus.SUCCESS, "Nạp thêm cuối tuần");
        saveTx(u1, w1Main, new BigDecimal("200000"), TransactionType.WITHDRAW, TransactionStatus.SUCCESS, "Rút về TK Vietcombank");
        saveTx(u1, w1Main, new BigDecimal("85000"), TransactionType.EXPENSE, TransactionStatus.SUCCESS, "Ăn trưa");
        saveTx(u1, w1Main, new BigDecimal("150000"), TransactionType.TRANSFER, TransactionStatus.SUCCESS, "Chuyển cho bạn bè");
        saveTx(u1, w1Main, new BigDecimal("300000"), TransactionType.WITHDRAW, TransactionStatus.PENDING, "Rút đang xử lý");

        // User 2
        saveTx(u2, w2Main, new BigDecimal("2000000"), TransactionType.TOP_UP, TransactionStatus.SUCCESS, "Nạp lương");
        saveTx(u2, w2Main, new BigDecimal("120000"), TransactionType.EXPENSE, TransactionStatus.SUCCESS, "Grab đi làm");
        saveTx(u2, w2Main, new BigDecimal("500000"), TransactionType.WITHDRAW, TransactionStatus.FAILED, "Rút thất bại (PayOS)");
        saveTx(u2, w2Main, new BigDecimal("250000"), TransactionType.INCOME, TransactionStatus.SUCCESS, "Thu nhập freelance");

        // User 3
        saveTx(u3, w3Main, new BigDecimal("500000"), TransactionType.TOP_UP, TransactionStatus.SUCCESS, "Nạp lần đầu");
        saveTx(u3, w3Main, new BigDecimal("50000"), TransactionType.EXPENSE, TransactionStatus.SUCCESS, "Cà phê");

        System.out.println("[SEED] Demo users (password User@123, PIN 123456):");
        System.out.println("  - nguyenvana / tranthib (active), leminhc (locked)");
        System.out.println("  - Wallets + sample transactions created");
    }

    private void seedPosts() {
        if (postRepository.count() > 0) {
            return;
        }

        postRepository.save(new Post(
                "Chào mừng đến SmartSpend",
                "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200",
                "https://smartspend.app",
                true
        ));
        postRepository.save(new Post(
                "Ưu đãi nạp tiền VietQR tháng này",
                "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200",
                "https://smartspend.app/topup",
                true
        ));
        postRepository.save(new Post(
                "Banner tạm ẩn — chiến dịch cũ",
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200",
                null,
                false
        ));

        System.out.println("[SEED] Demo posts/banners created (2 active, 1 inactive)");
    }

    private void seedSupportTickets() {
        if (supportTicketRepository.count() > 0) {
            return;
        }

        User admin = userRepository.findByUsername("admin").orElse(null);
        User u1 = userRepository.findByUsername("nguyenvana").orElse(null);
        User u2 = userRepository.findByUsername("tranthib").orElse(null);
        if (admin == null || u1 == null || u2 == null) {
            return;
        }

        SupportTicket t1 = supportTicketRepository.save(SupportTicket.builder()
                .user(u1)
                .subject("Không nhận được tiền nạp VietQR")
                .status(SupportTicketStatus.OPEN)
                .lastMessage("Mình đã chuyển nhưng ví chưa cộng tiền.")
                .lastMessageAt(LocalDateTime.now().minusMinutes(12))
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t1)
                .sender(u1)
                .senderType(SupportSenderType.USER)
                .content("Chào admin, mình nạp 500.000đ qua VietQR sáng nay nhưng ví chưa cộng tiền. Mã GD bank: VTQR77821.")
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t1)
                .sender(u1)
                .senderType(SupportSenderType.USER)
                .content("Mình đã chuyển nhưng ví chưa cộng tiền.")
                .build());

        SupportTicket t2 = supportTicketRepository.save(SupportTicket.builder()
                .user(u2)
                .subject("Hỗ trợ rút tiền PayOS bị lỗi")
                .status(SupportTicketStatus.IN_PROGRESS)
                .lastMessage("Bạn vui lòng gửi thêm ảnh biên lai giúp mình nhé.")
                .lastMessageAt(LocalDateTime.now().minusHours(1))
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t2)
                .sender(u2)
                .senderType(SupportSenderType.USER)
                .content("Lệnh rút 500.000đ về Vietcombank bị trạng thái Thất bại. Nhờ admin kiểm tra giúp.")
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t2)
                .sender(admin)
                .senderType(SupportSenderType.ADMIN)
                .content("Chào bạn, mình đã nhận yêu cầu. Bạn vui lòng gửi thêm ảnh biên lai giúp mình nhé.")
                .build());

        SupportTicket t3 = supportTicketRepository.save(SupportTicket.builder()
                .user(u1)
                .subject("Câu hỏi về sổ tay tiền mặt")
                .status(SupportTicketStatus.CLOSED)
                .lastMessage("Cảm ơn bạn, mình đã hiểu.")
                .lastMessageAt(LocalDateTime.now().minusDays(1))
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t3)
                .sender(u1)
                .senderType(SupportSenderType.USER)
                .content("Sổ tay tiền mặt có ảnh hưởng số dư ví chính không ạ?")
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t3)
                .sender(admin)
                .senderType(SupportSenderType.ADMIN)
                .content("Không ạ. Sổ tay chỉ dùng ghi chép cá nhân, không liên quan số dư ví MAIN.")
                .build());
        supportMessageRepository.save(SupportMessage.builder()
                .ticket(t3)
                .sender(u1)
                .senderType(SupportSenderType.USER)
                .content("Cảm ơn bạn, mình đã hiểu.")
                .build());

        System.out.println("[SEED] Demo support tickets created");
    }

    private User createUser(String username, String email, String encodedPassword, boolean active) {
        User user = new User(username, email, encodedPassword, Role.USER, active);
        return userRepository.save(user);
    }

    private Wallet createWallets(User user, String stk, BigDecimal mainBalance) {
        Wallet main = new Wallet(user, "Ví SmartSpend", mainBalance, true, false, WalletType.MAIN);
        main.setAccountNumber(stk);
        walletRepository.save(main);

        notebookBookRepository.save(NotebookBook.builder()
                .user(user)
                .name(NotebookBook.CASH_BOOK_NAME)
                .balance(BigDecimal.ZERO)
                .bookType(NotebookBookType.CASH)
                .build());
        return main;
    }

    private void saveTx(
            User user,
            Wallet wallet,
            BigDecimal amount,
            TransactionType type,
            TransactionStatus status,
            String note) {
        Transaction tx = new Transaction();
        tx.setUser(user);
        tx.setWallet(wallet);
        tx.setAmount(amount);
        tx.setType(type);
        tx.setStatus(status);
        tx.setTransactionCode("SEED-" + type.name().charAt(0) + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        tx.setNote(note);
        transactionRepository.save(tx);
    }
}
