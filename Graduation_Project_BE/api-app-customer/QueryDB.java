import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class QueryDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/graduation_project_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true", "root", "Giang123@");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT bank_code, bank_name, account_number, account_name FROM bank_accounts");
            while (rs.next()) {
                System.out.println(rs.getString("bank_code") + " | " + rs.getString("bank_name") + " | " + rs.getString("account_number") + " | " + rs.getString("account_name"));
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
