import java.util.concurrent.TimeUnit;
  
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
  
/**
* @author youthflies yeetrack.com
* Mytest.java  2013-5-19
* 测试所用临时文件
*/
public class Mytest
{
    public static void main(String[] args) throws InterruptedException
    {
        //可能需要设置firefox的路径
        WebDriver driver = new FirefoxDriver();
        try
        {
            driver.get("http://www.baidu.com");
            //利用webdriver键入搜索关键字
            //driver.findElement(By.id("kw")).sendKeys("yeetrack");
            //利用js代码键入搜索关键字
            ((JavascriptExecutor)driver).executeScript("document.getElementById(\"kw\").value=\"yeetrack\"");
            //利用js代码取出关键字
            String keyword = (String) ((JavascriptExecutor)driver).executeScript("var input = document.getElementById(\"kw\").value;return input");
            System.out.println(keyword);
            driver.findElement(By.id("su")).click();
            TimeUnit.SECONDS.sleep(5);
         }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        finally
        {
            driver.quit();
        }
 }
  
}
